"""
Query execution routes
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import re
from models.schemas import QueryRequest, QueryResponse, ExplainQueryRequest, ExplainQueryResponse
from services.session_manager import session_manager
from services.query_executor import QueryExecutor
from services.firestore_service import firestore_service
import io
import csv

router = APIRouter()


def _extract_table_name(sql: str, query_type: str) -> Optional[str]:
    """
    Extract table name from SQL query for syncing purposes.
    """
    sql_upper = sql.upper().strip()
    sql_clean = sql.strip()
    
    patterns = {
        'CREATE': r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)',
        'ALTER': r'ALTER\s+TABLE\s+(\w+)',
        'DROP': r'DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)',
        'INSERT': r'INSERT\s+INTO\s+(\w+)',
        'UPDATE': r'UPDATE\s+(\w+)',
        'DELETE': r'DELETE\s+FROM\s+(\w+)',
        'TRUNCATE': r'TRUNCATE\s+(?:TABLE\s+)?(\w+)',
    }
    
    pattern = patterns.get(query_type)
    if pattern:
        match = re.search(pattern, sql_clean, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return None


def _sync_after_query(session_id: str, sql: str, query_type: str):
    """
    Sync table data to Firestore after DDL/DML operations.
    This ensures tables created/modified via SQL are persisted for cross-device access.
    """
    try:
        session = session_manager.get_session(session_id)
        if not session:
            return
        
        user_id = session.get("user_id")
        if not user_id:
            return  # Don't sync for guest sessions
        
        table_name = _extract_table_name(sql, query_type)
        if not table_name:
            return
        
        # Handle CREATE TABLE - add to session's table list first
        if query_type == 'CREATE':
            # Add table to session if not already there
            if table_name not in session.get("tables", []):
                session_manager.add_table(session_id, table_name)
                print(f"[SYNC] Added new table '{table_name}' to session for user {user_id[:8]}...")
        
        # Handle DROP TABLE - remove from session and Firestore
        elif query_type == 'DROP':
            session_manager.remove_table(session_id, table_name)
            firestore_service.delete_table(user_id, table_name)
            print(f"[SYNC] Removed table '{table_name}' for user {user_id[:8]}...")
            return
        
        # Sync the table to Firestore (for CREATE, INSERT, UPDATE, DELETE, ALTER, TRUNCATE)
        conn = session_manager.get_connection(session_id)
        if conn:
            try:
                # Get table info
                columns_result = conn.execute(f"DESCRIBE {table_name}").fetchall()
                columns = [{"name": col[0], "type": col[1]} for col in columns_result]
                row_count = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
                
                # Save metadata
                firestore_service.save_table_metadata(
                    user_id=user_id,
                    session_id=session_id,
                    table_name=table_name,
                    columns=columns,
                    row_count=row_count
                )
                
                # Save data if not too large
                if row_count <= 10000:
                    data_result = conn.execute(f"SELECT * FROM {table_name}").fetchall()
                    column_names = [col['name'] for col in columns]
                    data = [list(row) for row in data_result]
                    
                    firestore_service.save_table_data(
                        user_id=user_id,
                        table_name=table_name,
                        data=data,
                        columns=column_names
                    )
                
                print(f"[SYNC] Synced table '{table_name}' to Firestore for user {user_id[:8]}...")
                
            except Exception as e:
                print(f"[SYNC] Error syncing table '{table_name}': {e}")
    
    except Exception as e:
        print(f"[SYNC] Error in _sync_after_query: {e}")


# Request/Response models for user query persistence
class SaveUserQueryRequest(BaseModel):
    user_id: str
    query: str


class GetUserQueryResponse(BaseModel):
    query: Optional[str] = None
    found: bool = False

@router.post("/execute", response_model=QueryResponse)
async def execute_query(request: QueryRequest):
    """
    Execute a SQL query
    
    Args:
        request: Query request with session_id and SQL
        
    Returns:
        Query results or error
    """
    # Validate session
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    # Check rate limit
    if not session_manager.check_rate_limit(request.session_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait before running more queries.")
    
    # Get connection
    conn = session_manager.get_connection(request.session_id)
    
    # Execute query
    result = QueryExecutor.execute_query(conn, request.sql)
    
    # Increment query count
    session_manager.increment_query_count(request.session_id)
    
    # If query modified data/schema, sync to Firestore for logged-in users
    if result.get('success') and result.get('query_type') in ['CREATE', 'ALTER', 'DROP', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']:
        _sync_after_query(request.session_id, request.sql, result.get('query_type'))
    
    return QueryResponse(**result)

@router.post("/explain", response_model=ExplainQueryResponse)
async def explain_query(request: ExplainQueryRequest):
    """
    Get query execution plan
    
    Args:
        request: Explain query request
        
    Returns:
        Query execution plan
    """
    # Validate session
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    # Get connection
    conn = session_manager.get_connection(request.session_id)
    
    # Get explain plan
    result = QueryExecutor.explain_query(conn, request.sql)
    
    if not result.get('success'):
        raise HTTPException(status_code=400, detail=result.get('error', 'Failed to explain query'))
    
    return ExplainQueryResponse(
        explain_plan=result['explain_plan'],
        estimated_rows=result.get('estimated_rows')
    )

@router.post("/download")
async def download_results(request: QueryRequest):
    """
    Execute query and download results as CSV
    
    Args:
        request: Query request
        
    Returns:
        CSV file stream
    """
    # Validate session
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    # Get connection
    conn = session_manager.get_connection(request.session_id)
    
    # Execute query
    result = QueryExecutor.execute_query(conn, request.sql)
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['error'])
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(result['columns'])
    
    # Write data
    writer.writerows(result['data'])
    
    # Get CSV content
    csv_content = output.getvalue()
    output.close()
    
    # Return as downloadable file
    return StreamingResponse(
        io.BytesIO(csv_content.encode('utf-8')),
        media_type='text/csv',
        headers={
            'Content-Disposition': 'attachment; filename="query_results.csv"'
        }
    )


# ==================== USER QUERY PERSISTENCE ====================

@router.post("/save-query")
async def save_user_query(request: SaveUserQueryRequest):
    """
    Save user's current query to Firestore for cross-device persistence.
    
    This allows users to continue working on their query from any device.
    """
    if not request.user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    
    success = firestore_service.save_user_query(request.user_id, request.query)
    
    if not success:
        # Don't fail the request if Firestore is unavailable, just log it
        print(f"Warning: Could not save query for user {request.user_id[:8]}...")
    
    return {"success": success, "message": "Query saved" if success else "Query not saved (Firestore unavailable)"}


@router.get("/user-query/{user_id}", response_model=GetUserQueryResponse)
async def get_user_query(user_id: str):
    """
    Get user's saved query from Firestore.
    
    Returns the latest query the user was working on.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    
    query = firestore_service.get_user_query(user_id)
    
    return GetUserQueryResponse(
        query=query,
        found=query is not None
    )


@router.delete("/user-query/{user_id}")
async def delete_user_query(user_id: str):
    """Delete user's saved query from Firestore."""
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    
    success = firestore_service.delete_user_query(user_id)
    
    return {"success": success}
