# Production Dockerfile for IRAH Services Backend
FROM python:3.11-slim-bookworm

# Install system dependencies for Matplotlib & ReportLab rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libfreetype6-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV MPLCONFIGDIR=/tmp/matplotlib-cache
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["python", "server.py"]
