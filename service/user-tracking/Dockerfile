FROM python:3.12.11-slim

WORKDIR /app

COPY requirements-container.txt .
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements-container.txt

COPY src/ .

EXPOSE 8000

CMD ["python", "main.py"]