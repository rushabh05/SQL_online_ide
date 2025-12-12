FROM python:3.11-slim

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create temp directory for sessions
RUN mkdir -p temp_sessions

# Expose port (Railway/Render will override with $PORT)
EXPOSE 8000

# Health check - use environment variable for port
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Set default port
ENV PORT=8000

# Run the application
# Use exec form with shell to properly expand PORT environment variable
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}

