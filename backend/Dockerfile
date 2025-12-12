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

# Make startup script executable
RUN chmod +x start.sh

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Set default port
ENV PORT=8000

# Run the application using the startup script
CMD ["./start.sh"]
