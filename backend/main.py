"""
FastAPI main application for Online SQL Playground
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import os
import sys

# Print startup info immediately for debugging
print("=" * 50, file=sys.stderr)
print("STARTING SQL PLAYGROUND BACKEND", file=sys.stderr)
print(f"PORT env: {os.environ.get('PORT', 'not set')}", file=sys.stderr)
print(f"Python version: {sys.version}", file=sys.stderr)
print("=" * 50, file=sys.stderr)

# Import routes (this will trigger Firestore init, but it's safe)
from routes import upload, query, session

print("Routes imported successfully", file=sys.stderr)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    print("FastAPI app starting up...", file=sys.stderr)
    yield
    print("FastAPI app shutting down...", file=sys.stderr)

# Create FastAPI app
app = FastAPI(
    title="Online SQL Playground API",
    description="Upload CSV files and run SQL queries safely",
    version="1.0.0",
    lifespan=lifespan
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
    print("Health check called!", file=sys.stderr)
    return {"status": "healthy", "port": os.environ.get("PORT", "8000")}

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
