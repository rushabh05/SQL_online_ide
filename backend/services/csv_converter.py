"""
CSV to SQL table conversion service
"""
import duckdb
from typing import Dict, List, Any
import os

class CSVConverter:
    """Handles CSV file conversion to SQL tables"""
    
    @staticmethod
    def convert_csv_to_table(
        conn: duckdb.DuckDBPyConnection,
        csv_path: str,
        table_name: str
    ) -> Dict[str, Any]:
        """
        Convert CSV file to DuckDB table and return schema info
        
        Args:
            conn: DuckDB connection
            csv_path: Path to CSV file
            table_name: Name for the SQL table
            
        Returns:
            Dictionary with table schema and preview data
        """
        # Create table in DuckDB using direct CSV import (DuckDB auto-detects types)
        conn.execute(f"""
            CREATE TABLE {table_name} AS 
            SELECT * FROM read_csv_auto('{csv_path}')
        """)
        
        # Get column information from DuckDB
        describe_result = conn.execute(f"DESCRIBE {table_name}").fetchall()
        columns = [
            {'name': row[0], 'type': row[1]}
            for row in describe_result
        ]
        
        # Get row count
        row_count = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        
        # Get preview data (first 100 rows)
        preview_result = conn.execute(f"SELECT * FROM {table_name} LIMIT 100").fetchall()
        preview_columns = [desc[0] for desc in conn.description]
        
        # Convert to list of dictionaries
        preview_data = [
            dict(zip(preview_columns, row))
            for row in preview_result
        ]
        
        return {
            'table_name': table_name,
            'columns': columns,
            'row_count': row_count,
            'preview_data': preview_data
        }
    
    @staticmethod
    def sanitize_table_name(filename: str) -> str:
        """
        Convert filename to valid SQL table name
        
        Args:
            filename: Original filename
            
        Returns:
            Sanitized table name
        """
        # Remove extension
        name = os.path.splitext(filename)[0]
        
        # Replace invalid characters with underscore
        valid_chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'
        sanitized = ''.join(c if c in valid_chars else '_' for c in name)
        
        # Ensure it starts with a letter
        if sanitized and sanitized[0].isdigit():
            sanitized = 'table_' + sanitized
        
        # Ensure it's not empty
        if not sanitized:
            sanitized = 'uploaded_table'
        
        return sanitized.lower()
    
    @staticmethod
    def get_table_info(conn: duckdb.DuckDBPyConnection, table_name: str) -> Dict[str, Any]:
        """Get information about an existing table"""
        # Get column info
        result = conn.execute(f"DESCRIBE {table_name}").fetchall()
        columns = [
            {'name': row[0], 'type': row[1]}
            for row in result
        ]
        
        # Get row count
        row_count = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        
        # Get preview
        preview_result = conn.execute(f"SELECT * FROM {table_name} LIMIT 100").fetchall()
        preview_columns = [desc[0] for desc in conn.description]
        preview_data = [
            dict(zip(preview_columns, row))
            for row in preview_result
        ]
        
        return {
            'table_name': table_name,
            'columns': columns,
            'row_count': row_count,
            'preview_data': preview_data
        }
