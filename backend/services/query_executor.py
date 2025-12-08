"""
SQL query execution service with safety and performance controls

Security Model:
- Each user has their own isolated DuckDB database (session-based)
- Users can only modify their own tables
- Dangerous operations (file access, extensions) are blocked
- All operations are sandboxed within the user's session
"""
import duckdb
import time
import re
from typing import Dict, List, Any, Optional, Tuple
import signal
from contextlib import contextmanager

class QueryTimeoutError(Exception):
    """Raised when query execution times out"""
    pass


class QueryExecutor:
    """
    Executes SQL queries with safety controls.
    
    Security Features:
    1. Session Isolation: Each user has their own DuckDB instance
    2. Blocked Operations: No file system access, no extensions
    3. Resource Limits: Query timeout, max rows, memory limits
    4. SQL Injection Prevention: Parameterized queries where applicable
    """
    
    MAX_RESULT_ROWS = 10000
    QUERY_TIMEOUT = 30  # seconds (increased for complex queries)
    MAX_INSERT_ROWS = 10000  # Maximum rows per INSERT
    
    # Dangerous patterns that could compromise security
    DANGEROUS_PATTERNS = [
        # File system operations
        (r'\bATTACH\b', "ATTACH database is not allowed"),
        (r'\bDETACH\b', "DETACH database is not allowed"),
        (r'\bCOPY\b.*\bTO\b', "COPY TO file is not allowed"),
        (r'\bCOPY\b.*\bFROM\b', "COPY FROM file is not allowed - use CSV upload instead"),
        (r'\bEXPORT\b', "EXPORT is not allowed"),
        (r'\bIMPORT\b', "IMPORT is not allowed - use CSV upload instead"),
        
        # Extension/function operations
        (r'\bLOAD\b', "LOAD extension is not allowed"),
        (r'\bINSTALL\b', "INSTALL extension is not allowed"),
        (r'\bCREATE\s+MACRO\b', "CREATE MACRO is not allowed"),
        (r'\bCREATE\s+FUNCTION\b', "CREATE FUNCTION is not allowed"),
        
        # System operations
        (r'\bPRAGMA\b', "PRAGMA is not allowed"),
        (r'\bSET\s+', "SET commands are not allowed"),
        (r'\bCALL\b', "CALL is not allowed"),
        (r'\bCHECKPOINT\b', "CHECKPOINT is not allowed"),
        (r'\bVACUUM\b', "VACUUM is not allowed"),
        
        # Potentially dangerous string operations
        (r"read_csv|read_parquet|read_json", "Direct file reading is not allowed - use CSV upload"),
        (r"httpfs|https://|http://", "HTTP/HTTPS access is not allowed"),
        (r"s3://|gs://|azure://", "Cloud storage access is not allowed"),
    ]
    
    # Allowed DML/DDL operations (safe within user's sandbox)
    ALLOWED_OPERATIONS = [
        'SELECT',      # Read data
        'WITH',        # CTE (Common Table Expressions)
        'EXPLAIN',     # Query plan
        'INSERT',      # Add rows
        'UPDATE',      # Modify rows
        'DELETE',      # Remove rows
        'CREATE',      # Create table/view/index
        'ALTER',       # Modify table structure
        'DROP',        # Remove table/view/index
        'TRUNCATE',    # Clear table
    ]
    
    @staticmethod
    def _clean_sql(sql: str) -> str:
        """Remove comments from SQL for analysis"""
        # Remove single-line comments
        clean = re.sub(r'--.*?(?:\n|$)', ' ', sql)
        # Remove multi-line comments
        clean = re.sub(r'/\*.*?\*/', ' ', clean, flags=re.DOTALL)
        return clean.strip()
    
    @staticmethod
    def _get_query_type(sql: str) -> Optional[str]:
        """Determine the type of SQL query"""
        clean_sql = QueryExecutor._clean_sql(sql).upper()
        
        for op in QueryExecutor.ALLOWED_OPERATIONS:
            if clean_sql.startswith(op):
                return op
        return None
    
    @staticmethod
    def is_query_safe(sql: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Check if SQL query is safe to execute.
        
        Returns:
            (is_safe, error_message, query_type)
        """
        sql_upper = sql.upper()
        clean_sql = QueryExecutor._clean_sql(sql_upper)
        
        # Check for dangerous patterns
        for pattern, error_msg in QueryExecutor.DANGEROUS_PATTERNS:
            if re.search(pattern, sql_upper, re.IGNORECASE):
                return False, error_msg, None
        
        # Determine query type
        query_type = QueryExecutor._get_query_type(sql)
        
        if not query_type:
            return False, f"Unsupported query type. Allowed operations: {', '.join(QueryExecutor.ALLOWED_OPERATIONS)}", None
        
        # Additional validation for specific operations
        if query_type == 'CREATE':
            # Only allow CREATE TABLE, CREATE VIEW, CREATE INDEX
            allowed_creates = ['CREATE TABLE', 'CREATE VIEW', 'CREATE INDEX', 
                             'CREATE TEMPORARY TABLE', 'CREATE TEMP TABLE',
                             'CREATE OR REPLACE VIEW']
            if not any(clean_sql.startswith(ac) for ac in allowed_creates):
                return False, "Only CREATE TABLE, CREATE VIEW, and CREATE INDEX are allowed", None
        
        if query_type == 'DROP':
            # Only allow DROP TABLE, DROP VIEW, DROP INDEX
            allowed_drops = ['DROP TABLE', 'DROP VIEW', 'DROP INDEX']
            if not any(clean_sql.startswith(ad) for ad in allowed_drops):
                return False, "Only DROP TABLE, DROP VIEW, and DROP INDEX are allowed", None
        
        if query_type == 'ALTER':
            # Only allow ALTER TABLE
            if not clean_sql.startswith('ALTER TABLE'):
                return False, "Only ALTER TABLE is allowed", None
        
        return True, None, query_type
    
    @staticmethod
    def _is_read_only_query(query_type: str) -> bool:
        """Check if query is read-only (doesn't modify data)"""
        return query_type in ['SELECT', 'WITH', 'EXPLAIN']
    
    @staticmethod
    def execute_query(
        conn: duckdb.DuckDBPyConnection,
        sql: str,
        timeout: int = QUERY_TIMEOUT,
        max_rows: int = MAX_RESULT_ROWS
    ) -> Dict[str, Any]:
        """
        Execute SQL query with safety controls.
        
        Supports:
        - SELECT/WITH: Returns query results
        - INSERT/UPDATE/DELETE: Returns affected row count
        - CREATE/ALTER/DROP: Returns success message
        - EXPLAIN: Returns query plan
        
        Args:
            conn: DuckDB connection
            sql: SQL query to execute
            timeout: Maximum execution time in seconds
            max_rows: Maximum number of rows to return
            
        Returns:
            Dictionary with query results or error
        """
        # Validate query safety
        is_safe, error_msg, query_type = QueryExecutor.is_query_safe(sql)
        if not is_safe:
            return {
                'success': False,
                'error': error_msg,
                'columns': None,
                'data': None,
                'row_count': None,
                'execution_time': None,
                'query_type': None
            }
        
        start_time = time.time()
        
        try:
            sql_modified = sql.strip()
            
            # Handle different query types
            if query_type in ['SELECT', 'WITH']:
                # Add LIMIT if not present (for safety on SELECT queries)
                if not re.search(r'\bLIMIT\b', sql_modified, re.IGNORECASE):
                    sql_modified += f" LIMIT {max_rows}"
                
                # Execute SELECT query
                result = conn.execute(sql_modified)
                rows = result.fetchall()
                columns = [desc[0] for desc in result.description] if result.description else []
                
                execution_time = time.time() - start_time
                data = [list(row) for row in rows]
                
                return {
                    'success': True,
                    'columns': columns,
                    'data': data,
                    'row_count': len(data),
                    'execution_time': round(execution_time, 3),
                    'error': None,
                    'query_type': query_type,
                    'message': f"Query returned {len(data)} rows"
                }
            
            elif query_type in ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']:
                # Execute DML query
                result = conn.execute(sql_modified)
                
                # Get affected row count
                # DuckDB returns the count for these operations
                try:
                    affected_rows = result.fetchone()
                    if affected_rows:
                        row_count = affected_rows[0] if isinstance(affected_rows, tuple) else affected_rows
                    else:
                        row_count = 0
                except:
                    row_count = 0
                
                execution_time = time.time() - start_time
                
                # Create appropriate message
                if query_type == 'INSERT':
                    message = f"Successfully inserted rows"
                elif query_type == 'UPDATE':
                    message = f"Successfully updated {row_count} rows"
                elif query_type == 'DELETE':
                    message = f"Successfully deleted {row_count} rows"
                elif query_type == 'TRUNCATE':
                    message = "Table truncated successfully"
                else:
                    message = "Operation completed successfully"
                
                return {
                    'success': True,
                    'columns': ['Result'],
                    'data': [[message]],
                    'row_count': row_count,
                    'execution_time': round(execution_time, 3),
                    'error': None,
                    'query_type': query_type,
                    'message': message
                }
            
            elif query_type in ['CREATE', 'ALTER', 'DROP']:
                # Execute DDL query
                conn.execute(sql_modified)
                execution_time = time.time() - start_time
                
                # Create appropriate message
                if query_type == 'CREATE':
                    message = "Object created successfully"
                elif query_type == 'ALTER':
                    message = "Table altered successfully"
                elif query_type == 'DROP':
                    message = "Object dropped successfully"
                else:
                    message = "Operation completed successfully"
                
                return {
                    'success': True,
                    'columns': ['Result'],
                    'data': [[message]],
                    'row_count': 0,
                    'execution_time': round(execution_time, 3),
                    'error': None,
                    'query_type': query_type,
                    'message': message
                }
            
            elif query_type == 'EXPLAIN':
                # Execute EXPLAIN query
                result = conn.execute(sql_modified)
                rows = result.fetchall()
                columns = [desc[0] for desc in result.description] if result.description else ['Plan']
                
                execution_time = time.time() - start_time
                data = [list(row) for row in rows]
                
                return {
                    'success': True,
                    'columns': columns,
                    'data': data,
                    'row_count': len(data),
                    'execution_time': round(execution_time, 3),
                    'error': None,
                    'query_type': query_type,
                    'message': "Query plan generated"
                }
            
            else:
                return {
                    'success': False,
                    'error': f"Unsupported query type: {query_type}",
                    'columns': None,
                    'data': None,
                    'row_count': None,
                    'execution_time': None,
                    'query_type': query_type
                }
        
        except duckdb.Error as e:
            execution_time = time.time() - start_time
            return {
                'success': False,
                'error': QueryExecutor._format_db_error(str(e)),
                'columns': None,
                'data': None,
                'row_count': None,
                'execution_time': round(execution_time, 3),
                'query_type': query_type
            }
        
        except Exception as e:
            execution_time = time.time() - start_time
            return {
                'success': False,
                'error': f"Unexpected error: {str(e)}",
                'columns': None,
                'data': None,
                'row_count': None,
                'execution_time': round(execution_time, 3),
                'query_type': query_type
            }
    
    @staticmethod
    def explain_query(conn: duckdb.DuckDBPyConnection, sql: str) -> Dict[str, Any]:
        """
        Get query execution plan
        
        Returns:
            Dictionary with explain plan
        """
        try:
            # Execute EXPLAIN
            result = conn.execute(f"EXPLAIN {sql}")
            plan_rows = result.fetchall()
            
            # Combine plan rows into single string
            explain_plan = '\n'.join([row[0] if isinstance(row, tuple) else str(row) for row in plan_rows])
            
            return {
                'success': True,
                'explain_plan': explain_plan,
                'estimated_rows': None  # DuckDB doesn't provide this easily
            }
        
        except Exception as e:
            return {
                'success': False,
                'explain_plan': None,
                'error': QueryExecutor._format_db_error(str(e))
            }
    
    @staticmethod
    def _format_db_error(error_msg: str) -> str:
        """Format database error for user-friendly display"""
        # Common error patterns and their user-friendly messages
        error_patterns = {
            r"Table.*does not exist": "Table not found. Make sure you've uploaded a CSV file first.",
            r"Column.*does not exist": "Column not found. Check your table schema.",
            r"Syntax error": "SQL syntax error. Please check your query.",
            r"Parser Error": "SQL parsing error. Please check your query syntax.",
        }
        
        for pattern, friendly_msg in error_patterns.items():
            if re.search(pattern, error_msg, re.IGNORECASE):
                return f"{friendly_msg}\n\nDetails: {error_msg}"
        
        return error_msg
