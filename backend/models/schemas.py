"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class SessionResponse(BaseModel):
    """Response model for session creation"""
    session_id: str
    expires_at: str
    message: str

class TableSchema(BaseModel):
    """Schema information for a table"""
    table_name: str
    columns: List[Dict[str, str]]  # [{name: str, type: str}]
    row_count: int
    preview_data: List[Dict[str, Any]]

class UploadResponse(BaseModel):
    """Response model for CSV upload"""
    session_id: str
    table_name: str
    table_info: TableSchema  # Renamed from 'schema' to avoid shadowing BaseModel.schema
    message: str

class QueryRequest(BaseModel):
    """Request model for SQL query execution"""
    session_id: str
    sql: str = Field(..., min_length=1, max_length=10000)

class QueryResponse(BaseModel):
    """Response model for query execution"""
    success: bool
    columns: Optional[List[str]] = None
    data: Optional[List[List[Any]]] = None
    row_count: Optional[int] = None
    execution_time: Optional[float] = None
    error: Optional[str] = None
    query_type: Optional[str] = None  # SELECT, INSERT, UPDATE, DELETE, CREATE, etc.
    message: Optional[str] = None  # User-friendly message about the operation

class SessionInfo(BaseModel):
    """Information about a session"""
    session_id: str
    tables: List[str]
    created_at: str
    expires_at: str

class ExplainQueryRequest(BaseModel):
    """Request model for query explanation"""
    session_id: str
    sql: str

class ExplainQueryResponse(BaseModel):
    """Response model for query explanation"""
    explain_plan: str
    estimated_rows: Optional[int] = None
