"""
FastAPI main application for Online SQL Playground
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os

from routes import upload, query, session

# Create FastAPI app
app = FastAPI(
    title="Online SQL Playground API",
    description="Upload CSV files and run SQL queries safely",
    version="1.0.0"
)

# Configure CORS
# For production, set ALLOWED_ORIGINS environment variable
# Example: ALLOWED_ORIGINS=https://your-app.vercel.app,https://yourdomain.com
allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "")
production_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

# Default development origins
dev_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
]

# Combine production and dev origins
all_origins = production_origins + dev_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(session.router, prefix="/api/session", tags=["Session"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(query.router, prefix="/api/query", tags=["Query"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Online SQL Playground API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc)
        }
    )

if __name__ == "__main__":
    # Get port from environment variable (Railway/Render set this)
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
