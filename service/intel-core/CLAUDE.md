# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`intel-core` is a Python FastAPI microservice that provides document-based AI chatbot functionality. Users upload HTML documents, start chat sessions, and ask questions answered by Google Gemini. It is one service within a larger `track-nest` monorepo.

- **Language**: Python 3.12
- **Framework**: FastAPI + Uvicorn
- **Port**: 48000
- **Root path prefix**: `/intel-core`

## Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn src.main:app --reload --port 48000

# Run production server
uvicorn src.main:app --host 0.0.0.0 --port 48000

# Run tests
pytest

# Format code
black src/
isort src/

# Docker
docker build -t intel-core .
docker run -p 48000:48000 --env-file .env intel-core
```

## Architecture

### Layers

```
controller/   →   domain/chatbot/    →   core/entity/
                  domain/mobility/   →   ai/anomaly_detector.py
                  domain/maintenance/
                    ↓
              configuration/   (DB, storage, Gemini, security, Kafka, Redis)
                    ↓
              util/            (settings, logging, exceptions, auth context)
```

- **`src/controller/chatbot_controller.py`** — FastAPI router with 5 endpoints (session CRUD, message, file upload, status)
- **`src/domain/chatbot/`** — Business logic; `chatbot_service_impl.py` is the core: builds Gemini prompts from document + conversation history, enforces the 15-message-per-session limit, strips HTML from uploaded files
- **`src/domain/mobility/`** — Kafka-driven location event processing; `MobilityMonitor` consumes `location-updated` events, runs anomaly detection, and publishes to `tracking-notification`
- **`src/domain/maintenance/`** — `SessionCleanupService`: periodic background task that deletes `ChatSession` rows older than `session_retention_days` using a distributed Redis lock to prevent multi-instance races
- **`src/ai/anomaly_detector.py`** — `AnomalyDetector` Protocol + `MockAnomalyDetector` stub (always returns `False`); swap out implementation without changing `MobilityMonitor`
- **`src/core/entity/`** — SQLAlchemy ORM models: `ChatSession` and `ChatMessage`
- **`src/configuration/`** — External service setup: SQLAlchemy engine, boto3 (S3/DigitalOcean Spaces), Google Gemini client, Keycloak JWT middleware, `aiokafka` consumer/producer, `redis.asyncio` client
- **`src/util/settings.py`** — Pydantic `Settings` class reads all config from environment variables / `.env`

### API Endpoints

All under `/intel-core/chatbot`:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/status` | Health check |
| POST | `/session` | Start chat session (associates document) |
| GET | `/session/{session_id}` | Retrieve session + message history |
| POST | `/message` | Send message, get Gemini AI response |
| POST | `/file/upload` | Upload HTML document to S3 |

### Authentication

JWT Bearer tokens issued by Keycloak. The middleware in `src/configuration/security/middleware.py` extracts user info and stores it in a `contextvars` context variable (`src/util/auth.py`). Auth is skipped for `/docs`, `/redoc`, `/openapi.json`, `/health`, `/healthz`.

### External Dependencies

| Service | Library | Purpose |
|---------|---------|---------|
| PostgreSQL (Neon) | `SQLAlchemy` + `psycopg2-binary` | Session/message persistence |
| DigitalOcean Spaces | `boto3` (S3-compatible) | Document file storage |
| Google Gemini | `google-genai` | AI response generation |
| Keycloak | `cryptography` / custom JWT | Authentication |
| Prometheus | `prometheus-fastapi-instrumentator` | Metrics |
| Kafka | `aiokafka` | Consume `location-updated`, produce `tracking-notification` |
| Redis | `redis[asyncio]` | Distributed lock for session cleanup |

### Error Handling

Custom exception hierarchy in `src/util/exceptions.py`: `AppException` is the base, with subclasses `BadRequestException`, `NotFoundException`, `ServiceUnavailableException`, `UnauthorizedException`, `ForbiddenException`. All errors include a correlation ID from the `X-Correlation-ID` request header.

### Key Business Rules

- Each `ChatSession` tracks `message_left` (starts at 15, decremented on each message)
- Document content is fetched from S3 and HTML-stripped before being embedded in the Gemini prompt
- The full conversation history is reconstructed from `ChatMessage` rows on every request to maintain context
- `SessionCleanupService` deletes sessions older than `session_retention_days` (default 3) every `cleanup_interval_hours` (default 24); uses a Redis `SET NX EX` lock so only one instance runs the delete per cycle
- `MobilityMonitor` is a long-running `asyncio.Task` started in the FastAPI lifespan; it deserialises `LocationMessage` (Pydantic) from raw Kafka bytes and, on anomaly, publishes a `TrackingNotificationMessage` to the notification topic

### Settings Reference (new fields)

| Env var | Default | Purpose |
|---------|---------|---------|
| `REDIS_URL` | `""` | Redis connection string (required for cleanup) |
| `SESSION_RETENTION_DAYS` | `3` | Sessions older than this are deleted |
| `CLEANUP_INTERVAL_HOURS` | `24` | How often the cleanup cycle runs |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker(s) |
| `KAFKA_GROUP_ID` | `intel-core` | Consumer group |
| `KAFKA_LOCATION_TOPIC` | `location-updated` | Topic to consume location events from |
| `KAFKA_NOTIFICATION_TOPIC` | `tracking-notification` | Topic to publish anomaly notifications to |
