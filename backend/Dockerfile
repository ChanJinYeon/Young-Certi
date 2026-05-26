FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /workspace

COPY backend /workspace/backend

RUN pip install --no-cache-dir -e /workspace/backend[dev]
