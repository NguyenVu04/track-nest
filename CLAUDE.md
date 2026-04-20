# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

TrackNest is a polyglot microservices monorepo for a real-time abduction-prevention / emergency-response platform. Top-level directories:

- `service/` — backend microservices (one subfolder per service, independent build)
  - `criminal-reports/` — Spring Boot (Java 25, Gradle). Crime/missing-person reports. Uses PostgreSQL + MinIO + Kafka + Redis.
  - `emergency-ops/` — Spring Boot (Java 25, Gradle). Emergency request lifecycle + safe locations. Keycloak-integrated.
  - `user-tracking/` — Spring Boot (Java 25, Gradle). Real-time location tracking. Exposes **gRPC** (via `spring-grpc` + protobuf) in addition to HTTP, uses Quartz scheduler, Firebase Admin, TimescaleDB (PostGIS/JTS spatial).
  - `intel-core/` — Python 3.12 FastAPI. Document-based Gemini chatbot + Kafka-driven mobility anomaly detection. See [service/intel-core/CLAUDE.md](service/intel-core/CLAUDE.md) for deep-dive.
- `frontend/`
  - `track-nets-web/` — Next.js 16 + React 19 + Tailwind v4 + shadcn/Radix + Leaflet web app.
  - `TrackNest/` — Expo React Native mobile app (Android). Uses `buf.gen.yaml` to generate gRPC-Web clients from `frontend/proto/*.proto`.
  - `proto/` — Shared `.proto` definitions (`tracker`, `trackingmanager`, `notifier`) consumed by mobile + user-tracking service.
- `keycloak/` — Realm import JSON for `public-dev` and `restricted-dev` realms + custom Dockerfile.
- `database/` — SQL init + seed scripts mounted into each service's Postgres container (naming: `01-<service>-init.sql`, `02-<service>-seed.sql`).
- `docker-compose/` — Local dev orchestration: `docker-compose.yaml` (dev) and `docker-compose.prod.yaml`. Includes a 3-controller + 3-broker Kafka KRaft cluster, MinIO (S3), Redis, Envoy (gRPC-Web proxy on 8800), Nginx (80), Keycloak, and per-service Postgres instances.
- `helm/` — Kubernetes deployment charts (`values.yaml`, `values-dev.yaml`, `values-prod.yaml`).
- `certs/` — TLS material for local dev.

## Common Commands

### Local stack (all services)
```bash
cd docker-compose
docker compose -f docker-compose.yaml up --build     # dev
docker compose -f docker-compose.prod.yaml up --build # prod-like
```

### Spring Boot services (`criminal-reports`, `emergency-ops`, `user-tracking`)
Run from each service directory:
```bash
./gradlew bootRun           # run
./gradlew build             # build (includes tests)
./gradlew test              # all tests
./gradlew test --tests 'FullyQualifiedTestClass.testMethod'  # single test
```
`user-tracking` additionally runs the protobuf plugin — `./gradlew generateProto` regenerates gRPC stubs into `build/generated/source/proto/`.

### Python service (`intel-core`)
```bash
cd service/intel-core
pip install -r requirements.txt
uvicorn src.main:app --reload --port 48000
pytest
pytest path/to/test_file.py::test_name    # single test
```

### Web frontend (`frontend/track-nets-web`)
```bash
npm run dev      # Next.js dev server on :3000
npm run build
npm run start
npm run lint
```

### Mobile app (`frontend/TrackNest`)
```bash
npx expo start        # Expo dev server
# gRPC client regeneration uses buf.gen.yaml against ../proto/*.proto
```

### Kubernetes
```bash
helm install --values values.yaml -f values-dev.yaml  tracknest ./helm
helm install --values values.yaml -f values-prod.yaml tracknest ./helm
```

## Architecture — How The Pieces Fit

### Entry / edge
- **Nginx** terminates HTTP on :80 and routes to `web` (Next.js) and Keycloak at `/auth`.
- **Envoy** on :8800 is the gRPC-Web bridge the mobile app talks to; it fronts `user-tracking`, `emergency-ops`, `criminal-reports`, `intel-core`, and `keycloak`.
- Helm deployments front the same services with APISIX instead of Nginx/Envoy.

### Identity
All services accept **Keycloak-issued JWTs** (realm `public-dev` for end users, `restricted-dev` for privileged actors). Emergency-ops wires a Keycloak client (`emergency-operations` client ID) directly. `intel-core` validates JWTs via custom middleware that sets user context in a `contextvars` variable.

### Data stores
Each Spring Boot service owns a dedicated **TimescaleDB (Postgres 17)** instance (ports 15432/25432/35432). `intel-core` reads from its own `intel_core_postgres`. Spatial queries use `hibernate-spatial` + JTS. Bulk object storage is **MinIO** in dev (S3-compatible) → DigitalOcean Spaces in prod for `intel-core`, configurable buckets per service.

### Event flow (Kafka)
Kafka KRaft cluster (3 controllers + 3 brokers). Important topic contracts:

| Producer | Topic | Consumer | Payload |
|---|---|---|---|
| `user-tracking` | `location-updated` | `intel-core` | `LocationMessage` (Pydantic/JSON) |
| `intel-core` | `tracking-notification` | notification fan-out | `TrackingNotificationMessage` when anomaly detected |

The anomaly pipeline lives in [service/intel-core/src/domain/mobility](service/intel-core/src/domain/mobility/) and runs as an async task in the FastAPI lifespan; swap `MockAnomalyDetector` for a real implementation via the `AnomalyDetector` Protocol without touching `MobilityMonitor`.

### gRPC surface
`user-tracking` is the only service that exposes gRPC (via `spring-grpc-spring-boot-starter`). Mobile clients call it through Envoy's gRPC-Web translation. The `.proto` files in [frontend/proto/](frontend/proto/) are the single source of truth; keep service and mobile generated code regenerated in sync when proto changes.

### Distributed locking / scheduling
Redis is shared across services for distributed locks (e.g., `intel-core`'s `SessionCleanupService` uses `SET NX EX` to run cleanup on a single instance) and for Spring caches. `user-tracking` also uses Quartz (tables in `database/tables_postgres.sql`) for durable scheduled jobs.

### Observability
Every Spring Boot service wires Micrometer + Prometheus + OpenTelemetry OTLP exporter. `intel-core` wires `prometheus-fastapi-instrumentator`. Correlation propagation uses `X-Correlation-ID` request headers end-to-end.

## Cross-Service Conventions

- **Java package root**: `project.tracknest.<service>` (e.g. `project.tracknest.usertracking`). Standard Spring layout inside: `configuration/`, `controller/`, `core/`, `domain/`.
- **Python layout mirrors Java conceptually** in `intel-core`: `controller → domain → core.entity`, with `configuration/` and `util/` horizontals.
- **Database init**: to add schema changes for a service, edit or add files in `database/` following the `0N-<service>-<purpose>.sql` prefix — docker-compose mounts them in order.
- **Env-driven config**: all services read from env vars (see `docker-compose.yaml` for the canonical dev values); do not hardcode secrets, use Vault in prod.
- **Allowed origins**: each service reads `ALLOWED_ORIGINS` (comma-separated) for CORS; keep in sync when adding a new frontend host.

## When Touching...

- **A `.proto` file**: regenerate both the `user-tracking` Java stubs (`./gradlew generateProto`) and the mobile app stubs (`buf generate` via `buf.gen.yaml`). Envoy config in `docker-compose/envoy/` may also need route updates if you add a new service.
- **A Kafka topic name**: update producer side, consumer side, and the relevant `KAFKA_*_TOPIC` env var defaults in `docker-compose.yaml` and helm values.
- **Keycloak realm**: edit `keycloak/public-dev.json` or `keycloak/restricted-dev.json` (imported on container start via `--import-realm`). The keycloak_postgres volume must be reset for re-import to take effect.
- **Spatial / location logic**: use JTS + `hibernate-spatial`; PostGIS extensions come from the TimescaleDB-HA image.
