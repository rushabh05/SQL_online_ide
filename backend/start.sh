#!/bin/sh
# Startup script for Railway deployment
# This ensures PORT environment variable is properly expanded

echo "Starting SQL Playground Backend..."
echo "PORT=$PORT"

# Use PORT from environment, default to 8000
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"

