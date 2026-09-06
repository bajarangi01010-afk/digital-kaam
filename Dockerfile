# Digital Kaam — Production Dockerfile for Smart Brain Backend
FROM python:3.11-slim

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements first
COPY backend/requirements.txt /app/backend/requirements.txt

# Install python dependencies
RUN pip install --no-cache-dir -r /app/backend/requirements.txt
RUN pip install --no-cache-dir pyjwt==2.13.0 uvicorn fastapi pydantic s2sphere

# Copy backend application code
COPY backend /app/backend

ENV PYTHONPATH=/app/backend
ENV PORT=8000
ENV HOST=0.0.0.0

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start Smart Brain Service
CMD ["python", "-m", "uvicorn", "smart_brain_service:app", "--app-dir", "/app/backend", "--host", "0.0.0.0", "--port", "8000"]
