"""
Query execution routes
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from models.schemas import QueryRequest, QueryResponse, ExplainQueryRequest, ExplainQueryResponse
from services.session_manager import session_manager
from services.query_executor import QueryExecutor
from services.firestore_service import firestore_service
import io
import csv

router = APIRouter()


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
