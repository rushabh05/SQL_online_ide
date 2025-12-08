"""
Session management routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from models.schemas import SessionResponse, SessionInfo
from services.session_manager import session_manager

router = APIRouter()

class CreateSessionRequest(BaseModel):
    user_id: Optional[str] = None

class RestoreSessionRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = None

@router.post("/create", response_model=SessionResponse)
async def create_session(request: CreateSessionRequest = CreateSessionRequest()):
    """Create a new user session, optionally linked to a user account"""
    try:
        session_id, expires_at = session_manager.create_session(user_id=request.user_id)
        
        return SessionResponse(
            session_id=session_id,
            expires_at=expires_at.isoformat(),
            message="Session created successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/restore", response_model=SessionResponse)
async def restore_session(request: RestoreSessionRequest):
    """Restore an existing session from disk, optionally linking to a user"""
    try:
        result = session_manager.restore_session(request.session_id, user_id=request.user_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found or expired")
        
        session_id, expires_at = result
        
        return SessionResponse(
            session_id=session_id,
            expires_at=expires_at.isoformat(),
            message="Session restored successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}")
async def get_user_session(user_id: str):
    """Get the session linked to a specific user"""
    try:
        result = session_manager.get_user_session(user_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="No session found for this user")
        
        session_id, expires_at = result
        
        return SessionResponse(
            session_id=session_id,
            expires_at=expires_at.isoformat(),
            message="User session found"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}", response_model=SessionInfo)
async def get_session_info(session_id: str):
    """Get information about a session"""
    session = session_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    return SessionInfo(
        session_id=session_id,
        tables=session["tables"],
        created_at=session["created_at"].isoformat(),
        expires_at=session["expires_at"].isoformat()
    )

@router.get("/{session_id}/tables")
async def get_session_tables(session_id: str):
    """Get all tables in a session with their schemas"""
    session = session_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    tables = session_manager.get_session_tables(session_id)
    
    return {"tables": tables}

@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    session = session_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_manager.delete_session(session_id)
    
    return {"message": "Session deleted successfully"}

@router.post("/cleanup")
async def cleanup_expired():
    """Cleanup expired sessions (admin endpoint)"""
    session_manager.cleanup_expired_sessions()
    return {"message": "Expired sessions cleaned up"}
