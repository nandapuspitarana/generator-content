FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=8765

WORKDIR /app

# Install system dependencies (libsndfile for audio I/O, curl for health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install PyTorch and Python packages
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8765

HEALTHCHECK --interval=20s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8765/health || exit 1

CMD ["python", "main.py"]
