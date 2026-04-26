# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Reality check**: the top-level [README.md](README.md) advertises pgEdge, APISIX, HashiCorp Vault, Milvus, and Elasticsearch. **None of these are wired up.** The codebase actually uses Neon/TimescaleDB Postgres, Nginx + Envoy, no secret manager (secrets live in env/compose files), no vector DB, no Elasticsearch. Trust this document and the code over the README.

## Repository Layout

TrackNest is a polyglot microservices monorepo for a real-time abduction-prevention / emergency-response platform. Top-level directories:

- `service/` — backend microservices (independent builds):
  - `criminal-reports/` — Spring Boot (Java 25, Gradle). Crime/missing-person reports. Postgres + MinIO/Spaces + Kafka + Redis. JPA/Hibernate-Spatial + JTS for geo queries.
  - `emergency-ops/` — Spring Boot (Java 25, Gradle). Emergency request lifecycle + safe locations. Keycloak-integrated (`emergency-operations` client).
  - `user-tracking/` — Spring Boot (Java 25, Gradle). Real-time location tracking. Exposes **gRPC** (via `spring-grpc` + protobuf) alongside HTTP. Uses Quartz (durable scheduler tables in `database/tables_postgres.sql`), Firebase Admin (push notifications), TimescaleDB.
  - `intel-core/` — Python 3.12 FastAPI. Document-grounded Gemini chatbot **and** the Kafka-driven mobility anomaly pipeline. See [service/intel-core/CLAUDE.md](service/intel-core/CLAUDE.md) for deep-dive.
- `frontend/`
  - `track-nets-web/` — Next.js 16 + React 19 + Tailwind v4 + shadcn/Radix + Leaflet.
  - `TrackNest/` — Expo React Native (Android). gRPC-Web clients generated from `frontend/proto/*.proto` via `buf.gen.yaml`.
  - `proto/` — **Single source of truth** for `tracker`, `trackingmanager`, `notifier` protos; consumed by mobile and by `user-tracking`.
- `keycloak/` — realm import JSON (`public-dev.json`, `restricted-dev.json`) + custom Dockerfile.
- `database/` — `0N-<service>-{init,seed}.sql` scripts mounted into per-service Postgres `docker-entrypoint-initdb.d/`. **These only run on fresh volumes** — there is no migration framework (no Flyway/Liquibase/Alembic). Re-seed requires wiping the volume.
- `docker-compose/` — local and "prod" orchestration:
  - `docker-compose.yaml` — full dev stack (Kafka KRaft 3c+3b, MinIO, Redis, Envoy, Nginx, Keycloak, per-service Postgres).
  - `docker-compose.prod.yaml` — same services pointed at managed backends (Aiven Kafka over SASL/SSL, Neon Postgres, Upstash Redis, DigitalOcean Spaces). **Secrets are currently committed in plaintext in this file** — treat as compromised; rotate before any real deployment.
- `helm/` — **stub only**. Contains `templates/secrets.yaml` and a bundled `kube-prometheus-stack` tarball. There are no Deployment/Service/Ingress/HPA manifests yet. The README's `helm install tracknest ./helm` command does not currently deploy the services.
- `certs/` — TLS material (Kafka truststore, CA PEM) for local dev.

## Common Commands

### Local stack
```bash
cd docker-compose
docker compose -f docker-compose.yaml up --build      # dev (in-cluster Kafka/Redis/Postgres)
docker compose -f docker-compose.prod.yaml up --build # against managed backends
```

### Spring Boot services (`criminal-reports`, `emergency-ops`, `user-tracking`)
Run from each service directory:
```bash
./gradlew bootRun
./gradlew build
./gradlew test
./gradlew test --tests 'FQCN.testMethod'     # single test
```
`user-tracking` additionally: `./gradlew generateProto` (regen gRPC stubs into `build/generated/source/proto/`).

### Python service (`intel-core`)
```bash
cd service/intel-core
pip install -r requirements.txt
uvicorn src.main:app --reload --port 48000
pytest
pytest path/to/test_file.py::test_name
```

### Web frontend (`frontend/track-nets-web`)
```bash
npm run dev     # :3000
npm run build && npm run start
npm run lint
```

### Mobile (`frontend/TrackNest`)
```bash
npx expo start
# gRPC client regen: buf generate (using frontend/TrackNest/buf.gen.yaml against ../proto)
```

## Architecture — How The Pieces Fit

### Edge / ingress
- **Nginx (:80)** terminates HTTP, routes `/auth` → Keycloak, `/` → `web` (Next.js). **No TLS configured** — add an upstream TLS terminator before public exposure.
- **Envoy (:8800)** is the gRPC-Web bridge the mobile app uses; fronts `user-tracking` (gRPC), plus HTTP for `emergency-ops`, `criminal-reports`, `intel-core`, `keycloak`. Admin listener on :9901 — do not expose.

### Identity
Keycloak issues JWTs. Realms: `public-dev` (end users) and `restricted-dev` (privileged actors). `emergency-ops` wires a Keycloak client directly; `intel-core` validates JWTs via custom middleware and stores user info in a `contextvars` variable. In the current compose, prod Keycloak runs `start-dev --import-realm` with `KC_HOSTNAME_STRICT_HTTPS: 'false'` — **dev mode, not production-hardened**.

### Data stores (per-service ownership)
Each Spring Boot service owns a dedicated Postgres instance:

| Service | Local image | Local port | Prod backend |
|---|---|---|---|
| user-tracking | timescale/timescaledb-ha:pg17 | 15432 | Neon |
| emergency-ops | timescale/timescaledb-ha:pg17 | 25432 | Neon |
| criminal-reports | timescale/timescaledb-ha:pg17 | 35432 | Neon |
| intel-core | (own) | — | Neon |
| keycloak | postgres:latest | 5432 | Neon |

Spatial queries use `hibernate-spatial` + JTS on TimescaleDB/PostGIS. Object storage is **MinIO (S3-compatible)** locally → **DigitalOcean Spaces** in prod. Redis is shared across all services for distributed locks and caching (Upstash in prod).

### Event flow (Kafka)
KRaft cluster locally (3 controllers + 3 brokers); **Aiven Kafka over SASL/SSL** in prod. Payloads are **bare JSON** — there is no schema registry, so topic contracts are enforced only by convention across services.

| Producer | Topic | Consumer | Payload |
|---|---|---|---|
| `user-tracking` | `location-updated` | `intel-core` (`MobilityMonitor`) | `LocationMessage` |
| `intel-core` | `tracking-notification` | notification fan-out | `TrackingNotificationMessage` |

The anomaly pipeline lives in [service/intel-core/src/domain/mobility](service/intel-core/src/domain/mobility/) and runs as an async task in the FastAPI lifespan. **Current detector is a stub** (`MockAnomalyDetector` in [service/intel-core/src/ai/anomaly_detector.py](service/intel-core/src/ai/anomaly_detector.py) always returns `False`); swap via the `AnomalyDetector` Protocol without touching `MobilityMonitor`.

**Known gap**: Spring Boot services write DB + publish Kafka in the same handler without a transactional outbox → dual-write risk. No DLQs, no explicit idempotent-producer config, no retry/backoff policy documented.

### gRPC surface
Only `user-tracking` exposes gRPC (via `spring-grpc-spring-boot-starter`). Mobile calls it through Envoy's gRPC-Web translation. Backend gRPC is **plaintext** (no mTLS). The `.proto` files in [frontend/proto/](frontend/proto/) are the single source of truth — regenerate both the Java (`./gradlew generateProto` in `user-tracking`) and the mobile (`buf generate`) stubs together when protos change.

### Distributed locking / scheduling
Redis provides distributed locks (e.g., `intel-core`'s `SessionCleanupService` uses `SET NX EX` so only one instance cleans per cycle). `user-tracking` uses Quartz with its JDBC store (tables from `database/tables_postgres.sql`) for durable scheduled jobs. Scaling `intel-core` beyond 1 replica requires keeping Kafka consumer-group IDs consistent or adding leader election for `MobilityMonitor`.

### Observability (partial)
Every Spring Boot service wires Micrometer + Prometheus + OpenTelemetry OTLP exporter; `intel-core` uses `prometheus-fastapi-instrumentator`. **But no collector, Prometheus, Grafana, or tracing backend is actually deployed** — the `kube-prometheus-stack` tarball in `helm/charts/` is not installed by any chart. Treat observability as "instrumented but not collected." Correlation propagation uses `X-Correlation-ID` headers end-to-end.

## Cross-Service Conventions

- **Java package root**: `project.tracknest.<service>` (e.g. `project.tracknest.usertracking`). Standard Spring layout: `configuration/`, `controller/`, `core/`, `domain/`.
- **Python layout mirrors Java conceptually** in `intel-core`: `controller → domain → core.entity`, with `configuration/` and `util/` horizontals.
- **Env-driven config**: services read env vars directly (see `docker-compose.yaml`/`.prod.yaml` for canonical values). There is no secret manager — do not introduce real secrets into committed files.
- **Schema changes**: edit/add `database/0N-<service>-*.sql`; because init scripts only run on fresh Postgres volumes, test by removing the volume (`docker compose down -v`). Adopting a migration tool is a known TODO.
- **CORS**: each service reads `ALLOWED_ORIGINS` (comma-separated). Currently set only to `localhost` values even in `docker-compose.prod.yaml` — update when exposing real hosts.
- **Image tags**: infra images (Kafka/Redis/Postgres/Envoy) currently use `latest`; pin before promoting to a real environment.

## When Touching...

- **A `.proto` file**: regenerate `user-tracking` Java stubs (`./gradlew generateProto`) **and** mobile stubs (`buf generate`). If you add a new gRPC service, update `docker-compose/envoy/envoy.yaml` route config too.
- **A Kafka topic name or schema**: update producer + consumer + `KAFKA_*_TOPIC` env var defaults in both compose files. Since payloads are unregistered JSON, also search for the Pydantic/POJO models that back them (`LocationMessage`, `TrackingNotificationMessage`) and version-bump field names carefully.
- **Keycloak realm**: edit `keycloak/public-dev.json` or `keycloak/restricted-dev.json`. Import only runs on a fresh `keycloak_postgres` volume — `docker compose down -v` the keycloak_postgres volume to re-import.
- **Spatial / location logic**: use JTS + `hibernate-spatial`; PostGIS extensions come from the TimescaleDB-HA image.
- **Anything claiming to be "production-ready"**: check first. Keycloak prod mode, real Helm charts, migrations, TLS at Nginx, secret management, DLQs, and HA are all currently missing — see the architecture review notes if you need the full list.
