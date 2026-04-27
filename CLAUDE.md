# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

TrackNest is a polyglot microservices monorepo for a real-time abduction-prevention / emergency-response platform. Top-level directories:

- `service/` — backend microservices (independent builds):
  - `criminal-reports/` — Spring Boot (Java 25, Gradle). Crime/missing-person reports. Postgres (PostGIS/JTS) + MinIO/Spaces + Kafka + Redis. Spring AI with Google Gemini (`gemini-3-flash-preview`) for AI-generated summaries. Port 38080.
  - `emergency-ops/` — Spring Boot (Java 25, Gradle). Emergency request lifecycle + safe locations. Keycloak Admin Client (`emergency-operations` client), WebSocket, Quartz scheduler, gRPC client, Kafka. Port 28080.
  - `user-tracking/` — Spring Boot (Java 25, Gradle). Real-time location tracking. Exposes **gRPC** (via `spring-grpc` + protobuf) alongside HTTP. Uses Quartz (durable scheduler tables in `database/tables_postgres.sql`), Firebase Admin (push notifications), Uber H3 (hexagonal spatial indexing), TimescaleDB. Port 19090 (gRPC).
- `frontend/`
  - `track-nest-web/` — Next.js 16 + React 19 + Tailwind v4 + shadcn/Radix + Leaflet. Deployed to Vercel. Uses keycloak-js, STOMP/SockJS for WebSocket, TinyMCE for rich-text editing.
  - `TrackNest/` — Expo React Native (Android). gRPC-Web clients generated from `frontend/proto/*.proto` via `buf.gen.yaml`. Uses `@connectrpc/connect-web` + `grpc-web` for gRPC-Web transport.
  - `proto/` — **Single source of truth** for `tracker`, `trackingmanager`, `notifier` protos; consumed by mobile and by `user-tracking`.
- `keycloak/` — realm import JSON (`public-dev.json`, `restricted-dev.json`) + custom Dockerfile.
- `database/` — `0N-<service>-{init,seed}.sql` scripts mounted into per-service Postgres `docker-entrypoint-initdb.d/`. **These only run on fresh volumes** — there is no migration framework (no Flyway/Liquibase). Re-seed requires wiping the volume.
- `docker-compose/` — local and "prod" orchestration:
  - `docker-compose.yaml` — full dev stack (Kafka KRaft 3 controllers + 3 brokers, MinIO, Redis, Envoy, Nginx, Keycloak, per-service Postgres).
  - `docker-compose.prod.yaml` — same services pointed at managed backends (Aiven Kafka over SASL/SSL, Neon Postgres, Upstash Redis, DigitalOcean Spaces). **Secrets are committed in plaintext in this file** — treat as compromised; rotate before any real deployment.
- `helm/` — Kubernetes Helm chart with real Deployment/Service/HPA/PDB manifests for all three services, Keycloak, and Envoy gateway. Bundles `kube-prometheus-stack`, `loki`, and `promtail` subcharts. Deployed via the `deploy` branch CI pipeline; the `values-secrets.yaml` file is generated at deploy time from GitHub Secrets and never committed.
- `test/` — k6 load testing scripts.
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

### Web frontend (`frontend/track-nest-web`)
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
- **Envoy (:8800)** is the gRPC-Web bridge the mobile app uses; fronts `user-tracking` (gRPC), plus HTTP for `emergency-ops`, `criminal-reports`, and `keycloak`. Admin listener on :9901 — do not expose.

### Identity
Keycloak issues JWTs. Realms: `public-dev` (open registration, end users) and `restricted-dev` (closed, privileged actors). `emergency-ops` wires a Keycloak Admin Client directly using the `emergency-operations` client. In the current compose, Keycloak runs `start-dev --import-realm` with `KC_HOSTNAME_STRICT_HTTPS: 'false'` — **dev mode, not production-hardened**.

### Data stores (per-service ownership)
Each Spring Boot service owns a dedicated Postgres instance:

| Service | Local image | Local port | Prod backend |
|---|---|---|---|
| user-tracking | timescale/timescaledb-ha:pg17 | 15432 | Neon |
| emergency-ops | timescale/timescaledb-ha:pg17 | 25432 | Neon |
| criminal-reports | timescale/timescaledb-ha:pg17 | 35432 | Neon |
| keycloak | postgres:latest | 5432 | Neon |

All local databases use `tracknestadmin`/`tracknestadmin` credentials. Spatial queries use `hibernate-spatial` + JTS on TimescaleDB/PostGIS. Object storage is **MinIO (S3-compatible)** locally → **DigitalOcean Spaces** in prod. Redis (port 6379) is shared across services for distributed locks and caching (Upstash in prod).

### Event flow (Kafka)
KRaft cluster locally (3 controllers + 3 brokers on ports 29092/39092/49092); **Aiven Kafka over SASL/SSL** in prod. Payloads are **bare JSON** — there is no schema registry, so topic contracts are enforced only by convention.

`user-tracking` publishes location events to Kafka. There is currently no downstream consumer service in this repo — the `intel-core` Python anomaly-detection service described in earlier documentation does not exist in the codebase.

**Known gap**: Spring Boot services write DB + publish Kafka in the same handler without a transactional outbox → dual-write risk. No DLQs, no explicit idempotent-producer config, no retry/backoff policy documented.

### gRPC surface
`user-tracking` exposes gRPC on port 19090 (via `spring-grpc-spring-boot-starter`). `emergency-ops` includes the gRPC client stub dependency. Mobile calls `user-tracking` through Envoy's gRPC-Web translation. Backend gRPC is **plaintext** (no mTLS). The `.proto` files in [frontend/proto/](frontend/proto/) are the single source of truth — regenerate both the Java (`./gradlew generateProto` in `user-tracking`) and the mobile (`buf generate`) stubs together when protos change.

### AI integration
`criminal-reports` uses Spring AI with the Google Gemini client (`gemini-3-flash-preview`) for AI-generated content (e.g. report summaries). The Gemini API key is injected via `GOOGLE_GEMINI_API_KEY` environment variable.

### Distributed locking / scheduling
Redis provides distributed locks. `user-tracking` and `emergency-ops` both use Quartz with the JDBC store (tables from `database/tables_postgres.sql`) for durable scheduled jobs.

### Observability
Every Spring Boot service wires Micrometer + Prometheus + OpenTelemetry OTLP exporter. **In local dev, no collector, Prometheus, or Grafana is deployed** — treat as "instrumented but not collected." The Helm chart bundles `kube-prometheus-stack`, `loki`, and `promtail` for production K8s. Correlation propagation uses `X-Correlation-ID` headers end-to-end.

### CI/CD
- **test.yaml** (main branch): path-based change detection triggers per-service test jobs (`./gradlew test` for Java, `jest` for frontend), then a unified SonarCloud scan. A `ci-gate` job enforces all checks before merge.
- **deploy.yaml** (deploy branch): builds Docker images → pushes to Docker Hub (`nguyenvu04/tracknest-*`), deploys the web frontend to Vercel, and runs `helm upgrade --install` against the DigitalOcean K8s cluster.

## Cross-Service Conventions

- **Java package root**: `project.tracknest.<service>` (e.g. `project.tracknest.usertracking`). Standard Spring layout: `configuration/`, `controller/`, `core/`, `domain/`.
- **Env-driven config**: services read env vars directly (see `docker-compose.yaml`/`.prod.yaml` for canonical values). There is no secret manager — do not introduce real secrets into committed files.
- **Schema changes**: edit/add `database/0N-<service>-*.sql`; because init scripts only run on fresh Postgres volumes, test by removing the volume (`docker compose down -v`). Adopting a migration tool is a known TODO.
- **CORS**: each service reads `ALLOWED_ORIGINS` (comma-separated). Currently set only to `localhost` values even in `docker-compose.prod.yaml` — update when exposing real hosts.
- **Image tags**: infra images (Kafka/Redis/Postgres/Envoy) currently use `latest`; pin before promoting to a real environment.

## When Touching...

- **A `.proto` file**: regenerate `user-tracking` Java stubs (`./gradlew generateProto`) **and** mobile stubs (`buf generate`). If you add a new gRPC service, update `docker-compose/envoy/envoy.yaml` route config too.
- **A Kafka topic name or schema**: update producer env var defaults in both compose files and search for the POJOs that back the payload.
- **Keycloak realm**: edit `keycloak/public-dev.json` or `keycloak/restricted-dev.json`. Import only runs on a fresh `keycloak_postgres` volume — `docker compose down -v` the keycloak_postgres volume to re-import.
- **Spatial / location logic**: use JTS + `hibernate-spatial`; PostGIS extensions come from the TimescaleDB-HA image.
- **AI prompts / model**: Spring AI config is in `criminal-reports`. The model name (`GOOGLE_GEMINI_CHAT_MODEL`) and API key (`GOOGLE_GEMINI_API_KEY`) are injected via env vars.
- **Helm values**: edit `helm/values.yaml` for structural changes. Secret values go in `helm/values-secrets.yaml` which is generated at deploy time from GitHub Secrets and must never be committed.
