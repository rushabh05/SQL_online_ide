"""
File upload routes
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from models.schemas import UploadResponse, TableSchema
from services.session_manager import session_manager
from services.csv_converter import CSVConverter
from services.sample_data_generator import SampleDataGenerator
import os
import aiofiles

router = APIRouter()

class GenerateSampleRequest(BaseModel):
    session_id: str
    table_name: str
    row_count: int = 50

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

@router.post("/csv", response_model=UploadResponse)
async def upload_csv(
    session_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Upload a CSV file and convert it to a SQL table
    
    Args:
        session_id: Active session ID
        file: CSV file to upload
        
    Returns:
        Upload response with table schema
    """
    # Validate session
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    # Read file content
    content = await file.read()
    
    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / 1024 / 1024}MB"
        )
    
    try:
        # Save file temporarily
        session_dir = session["session_dir"]
        file_path = os.path.join(session_dir, file.filename)
        
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Convert filename to table name
        table_name = CSVConverter.sanitize_table_name(file.filename)
        
        # Check if table already exists, make unique if needed
        conn = session_manager.get_connection(session_id)
        existing_tables = session["tables"]
        if table_name in existing_tables:
            counter = 1
            while f"{table_name}_{counter}" in existing_tables:
                counter += 1
            table_name = f"{table_name}_{counter}"
        
        # Convert CSV to table
        table_info = CSVConverter.convert_csv_to_table(
            conn=conn,
            csv_path=file_path,
            table_name=table_name
        )
        
        # Add table to session
        session_manager.add_table(session_id, table_name)
        
        # Create response
        table_schema = TableSchema(**table_info)
        
        return UploadResponse(
            session_id=session_id,
            table_name=table_name,
            table_info=table_schema,
            message=f"File '{file.filename}' uploaded and converted to table '{table_name}'"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

@router.get("/tables/{session_id}")
async def list_tables(session_id: str):
    """List all tables in a session"""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    conn = session_manager.get_connection(session_id)
    tables_info = []
    
    for table_name in session["tables"]:
        try:
            table_info = CSVConverter.get_table_info(conn, table_name)
            tables_info.append(TableSchema(**table_info))
        except:
            continue
    
    return {"tables": tables_info}

@router.delete("/table/{session_id}/{table_name}")
async def delete_table(session_id: str, table_name: str):
    """
    Delete a table from a session
    
    Args:
        session_id: Active session ID
        table_name: Name of the table to delete
        
    Returns:
        Success message
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    # Check if table exists in session
    if table_name not in session["tables"]:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found in session")
    
    try:
        # Drop the table from DuckDB
        conn = session_manager.get_connection(session_id)
        conn.execute(f"DROP TABLE IF EXISTS {table_name}")
        
        # Remove from session's table list
        session_manager.remove_table(session_id, table_name)
        
        return {
            "message": f"Table '{table_name}' deleted successfully",
            "remaining_tables": session["tables"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting table: {str(e)}")

@router.post("/generate-sample", response_model=UploadResponse)
async def generate_sample_table(request: GenerateSampleRequest):
    """
    Generate a sample table with realistic data
    
    Args:
        request: Contains session_id, table_name, and row_count
        
    Returns:
        Upload response with table schema
    """
    # Validate session
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    # Sanitize table name
    table_name = CSVConverter.sanitize_table_name(request.table_name)
    
    # Check if table already exists
    conn = session_manager.get_connection(request.session_id)
    existing_tables = session["tables"]
    if table_name in existing_tables:
        counter = 1
        while f"{table_name}_{counter}" in existing_tables:
            counter += 1
        table_name = f"{table_name}_{counter}"
    
    try:
        # Generate sample data
        generator = SampleDataGenerator()
        table_info = generator.generate_table(
            conn=conn,
            table_name=table_name,
            row_count=request.row_count
        )
        
        # Add table to session
        session_manager.add_table(request.session_id, table_name)
        
        # Create response
        table_schema = TableSchema(**table_info)
        
        return UploadResponse(
            session_id=request.session_id,
            table_name=table_name,
            table_info=table_schema,
            message=f"Sample table '{table_name}' generated with {request.row_count} rows"
        )
    
    except Exception as e:
        import traceback
        error_detail = f"Error generating sample table: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Print to console for debugging
        raise HTTPException(status_code=500, detail=error_detail)
