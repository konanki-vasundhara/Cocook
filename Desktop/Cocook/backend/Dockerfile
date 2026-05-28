FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Remove .env file from image (secrets should be injected at runtime)
RUN rm -f .env

# Use PORT env var (set by Render, Railway, Heroku, etc.) or default to 8000
ENV PORT=8000
EXPOSE ${PORT}

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
