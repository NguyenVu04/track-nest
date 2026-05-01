# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

TrackNest is a polyglot microservices monorepo for a real-time abduction-prevention / emergency-response platform. Top-level directories:

- `service/` — backend microservices (independent builds):
  - `criminal-reports/` — Spring Boot (Java 25, Gradle). Crime/missing-person reports. Postgres (PostGIS/JTS) + MinIO/Spaces + Kafka + Redis. Spring AI with Google Gemini (`gemini-2.0-flash`) for AI-generated summaries. Port 38080.
  - `emergency-ops/` — Spring Boot (Java 25, Gradle). Emergency request lifecycle + safe locations. Keycloak Admin Client (`emergency-operations` client), WebSocket (STOMP), Quartz scheduler, gRPC client stub, Kafka. Port 28080.
  - `user-tracking/` — Spring Boot (Java 25, Gradle). Real-time location tracking. Exposes **gRPC** (via `spring-grpc` + protobuf) alongside HTTP. Uses Quartz (durable scheduler tables in `database/tables_postgres.sql`), Firebase Admin (push notifications), Uber H3 (hexagonal spatial indexing), TimescaleDB. Port 19090 (gRPC).
- `frontend/`
  - `track-nest-web/` — Next.js 16 + React 19 + Tailwind v4 + shadcn/Radix + Leaflet. Deployed to Vercel. Uses keycloak-js, STOMP/SockJS for WebSocket, TinyMCE for rich-text editing, `next-intl` for i18n (EN + VI).
  - `TrackNest/` — Expo React Native (Android). gRPC-Web clients generated from `frontend/proto/*.proto` via `buf.gen.yaml`. Uses `@connectrpc/connect-web` with `grpc-web` transport.
  - `proto/` — **Single source of truth** for `tracker`, `trackingmanager`, `notifier`, `familymessage` protos; consumed by mobile and by `user-tracking`.
- `keycloak/` — realm import JSON (`public-dev.json`, `restricted-dev.json`) + custom Dockerfile.
- `database/` — `0N-<service>-{init,seed}.sql` scripts mounted into per-service Postgres `docker-entrypoint-initdb.d/`. **These only run on fresh volumes** — there is no migration framework (no Flyway/Liquibase). Re-seed requires wiping the volume (`docker compose down -v`).
- `docker-compose/` — local and "prod" orchestration:
  - `docker-compose.yaml` — full dev stack (Kafka KRaft 3 controllers + 3 brokers, MinIO, Redis, Envoy, Nginx, Keycloak, per-service Postgres).
  - `docker-compose.prod.yaml` — same services pointed at managed backends (Aiven Kafka over SASL/SSL, Neon Postgres, Upstash Redis, DigitalOcean Spaces). **Secrets are committed in plaintext in this file** — treat as compromised; rotate before any real deployment.
- `helm/` — Kubernetes Helm chart with Deployment/Service/HPA/PDB manifests for all three services, Keycloak, and Envoy gateway. Bundles `kube-prometheus-stack`, `loki`, and `promtail` subcharts.
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
- **Nginx (:80)** terminates HTTP, routes `/auth` → Keycloak, `/` → `web` (Next.js). No TLS configured — add an upstream TLS terminator before public exposure.
- **Envoy (:8800)** is the gRPC-Web bridge the mobile app uses; fronts `user-tracking` (gRPC), plus HTTP for `emergency-ops`, `criminal-reports`, and `keycloak`. Envoy also runs a `jwt_authn` filter that **validates JWT signatures against Keycloak's JWKS endpoints** before forwarding to backend services. Admin listener on :9901 — do not expose.

### Identity & Auth Chain

Keycloak issues JWTs. Realms: `public-dev` (open registration, end users) and `restricted-dev` (closed, privileged actors). The auth chain is:

1. **Envoy validates the JWT signature** via `jwt_authn` filter (checks both `public-dev` and `restricted-dev` JWKS).
2. **Services decode the JWT payload without re-verifying the signature** — `KeycloakFilter` (HTTP) and `GrpcSecurityInterceptor` Base64-decode the JWT and populate the Spring `SecurityContext` with user ID (`sub` claim) and roles (`realm_access.roles`).
3. **`criminal-reports` controllers require an `X-User-Id` header** (`@RequestHeader("X-User-Id") UUID userId`) in addition to the JWT — this header carries the caller's user UUID for ownership operations (create/update/delete own reports). Nothing enforces that `X-User-Id` matches the JWT `sub` claim, so the frontend must send both consistently.
4. **WebSocket auth fallback:** STOMP upgrades cannot send `Authorization` headers, so `emergency-ops` accepts `?access_token=<jwt>` as a query parameter.
5. **Auto-provisioning:** `criminal-reports` and `emergency-ops` upsert a local user record (Reporter / EmergencyService) on first authenticated request.

`emergency-ops` also wires a **Keycloak Admin Client** (service account, `emergency-operations` client ID) for direct Keycloak Admin API calls (full user profile lookups), cached in Redis for 10 minutes.

### Data Stores (per-service ownership)

Each Spring Boot service owns a dedicated Postgres instance:

| Service | Local image | Local port | Prod backend |
|---|---|---|---|
| user-tracking | timescale/timescaledb-ha:pg17 | 15432 | Neon |
| emergency-ops | timescale/timescaledb-ha:pg17 | 25432 | Neon |
| criminal-reports | timescale/timescaledb-ha:pg17 | 35432 | Neon |
| keycloak | postgres:latest | 5432 | Neon |

All local databases use `tracknestadmin`/`tracknestadmin` credentials. Spatial queries use `hibernate-spatial` + JTS on TimescaleDB/PostGIS. Object storage is **MinIO (S3-compatible)** locally → **DigitalOcean Spaces** in prod. Redis (port 6379) is shared across services for distributed locks and caching (Upstash in prod).

**Required Postgres extensions** (set in init SQL per service):
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
-- user-tracking only:
CREATE EXTENSION IF NOT EXISTS "h3";
```

**Entity conventions:**
- UUID PKs: `@GeneratedValue(strategy = GenerationType.UUID)` in JPA / `DEFAULT gen_random_uuid()` in SQL.
- Geospatial entities have both `latitude`/`longitude` float columns **plus** a `geom geometry(Point,4326)` GENERATED ALWAYS AS (via PostGIS) column — updated by the DB, not the application.
- No soft deletes — use hard deletes or a `status` column.
- Status reference tables (e.g., `emergency_request_status`, `missing_person_report_status`) with `*_status_translation` tables for i18n.
- Partial unique indexes enforce business invariants (e.g., at most one active emergency request per target user).
- `user-tracking`'s `location` table is a **TimescaleDB hypertable** partitioned by timestamp (1-day chunks) + 64 space partitions on `user_id`.

### Event Flow (Kafka)

KRaft cluster locally (3 controllers + 3 brokers on ports 29092/39092/49092); **Aiven Kafka over SASL/SSL** in prod. Payloads are **bare JSON** — no schema registry; topic contracts are enforced only by convention.

| Producer | Topic | Consumer | Purpose |
|---|---|---|---|
| `user-tracking` | `location-updated` | `emergency-ops` | Fan-out location to observers |
| `user-tracking` | `tracking-notification` | notification fan-out | H3 anomaly detected |
| `emergency-ops` | `risk-notification` | notification fan-out | Risk detected for target |

**Known gap:** Spring Boot services write DB + publish Kafka in the same handler without a transactional outbox → dual-write risk. No DLQs, idempotent-producer config, or retry/backoff policy.

### Multi-Server Location Fan-Out (user-tracking + emergency-ops)

Location streaming across multiple pods works through a Redis pub/sub layer:

1. Mobile uploads location → `TrackerController.updateUserLocation` → saves to DB + publishes to `location-updated`.
2. `LocationQueryTrigger` (`@KafkaListener`) checks if target users' streaming observers are on **this** pod or another.
3. If on **this pod:** write directly to the `StreamObserver`.
4. If on **another pod:** publish a `ServerRedisMessage{method:"receiveLocationMessage"}` to that pod's Redis channel.
5. Each pod subscribes to its own Redis channel keyed by `serverIdProvider.getServerId()` (derived from `POD_NAME`/`POD_UID` env vars).

`UpdateGrpcSessionsJob` (Quartz, every 3 min) keeps the Redis `GrpcSession` registry in sync. The same pattern applies to `emergency-ops` WebSocket sessions via `UpdateWebSocketSessionsJob`.

### gRPC Surface

`user-tracking` exposes four gRPC services on port 19090 (via `spring-grpc-spring-boot-starter`):
- `TrackerController` — streaming location updates + location history.
- `TrackingManagerController` — family circle CRUD with OTP-based joining.
- `NotifierController` — mobile device token registration + notification management.
- `FamilyMessageController` — in-app family messaging.

`emergency-ops` includes the gRPC **client** stub dependency to call `user-tracking`. Backend gRPC is **plaintext** (no mTLS). Mobile calls through Envoy's gRPC-Web translation. The `.proto` files in `frontend/proto/` are the single source of truth — regenerate both Java (`./gradlew generateProto` in `user-tracking`) and mobile (`buf generate`) stubs when protos change.

### H3 Anomaly Detection (user-tracking)

Runs synchronously inside the location-update transaction:
- Indexes locations into **Uber H3 hexagonal cells** (resolution 8, ring size 1).
- Requires ≥ 20 cell visits before flagging; buckets by (userId, dayOfWeek, hourOfDay).
- Publishes `TrackingNotificationMessage` to `tracking-notification` topic on anomaly.
- `AnomalyRun` table suppresses re-alerting for 1 hour per user.

Scheduled maintenance Quartz jobs (daily midnight): `CellVisitMaintenanceJob`, `AnomalyRunCleanupJob`, `LocationCleanupJob`.

### AI Integration

`criminal-reports` uses Spring AI with Google Gemini (`gemini-2.0-flash`) for AI-generated content (e.g., report summaries). API key injected via `GOOGLE_GEMINI_API_KEY`.

### Observability

Every Spring Boot service wires Micrometer + Prometheus + OpenTelemetry OTLP exporter. **In local dev, no collector, Prometheus, or Grafana is deployed** — instrumented but not collected. The Helm chart bundles `kube-prometheus-stack`, `loki`, and `promtail` for production K8s; AlertManager routes to Telegram. Correlation propagation uses `X-Correlation-ID` headers end-to-end.

### CI/CD

- **`test.yaml`** (main branch): dorny/paths-filter detects which services changed → per-service test jobs (`./gradlew test jacocoTestReport` for Java, `jest` for frontend) → SonarCloud scan → `ci-gate` job enforces all checks before merge.
- **`deploy.yaml`** (deploy branch): builds Docker images (`nguyenvu04/tracknest-<service>:sha-<commit-short>`) → pushes to Docker Hub → deploys web to Vercel → runs `helm upgrade --install` against DigitalOcean K8s. `values-secrets.yaml` is generated from GitHub Secrets at deploy time and never committed.

## Domain Layer Patterns (Spring Boot Services)

All three services follow a consistent internal package layout under `project.tracknest.<service>`:

```
configuration/   — Spring beans, security, Kafka/Redis/MinIO config
controller/      — @RestController / gRPC service impls; delegate to domain services; own DTOs
core/            — shared datatypes (e.g., KeycloakPrincipal, PageResponse), utilities
domain/
  <feature>/
    <FeatureName>Service.java       — public interface (the contract)
    dto/                            — request/response DTOs for this feature
    impl/
      <FeatureName>ServiceImpl.java — package-private implementation
      <Entity>Repository.java       — Spring Data JPA interface, scoped here
```

Rules that hold across all services:
- Controllers call **service interfaces only** — never repositories directly.
- No cross-domain repository sharing — inter-domain calls go through service interfaces.
- `SecurityUtils.getCurrentUserId()` / `getCurrentUserDetails()` reads from the Spring `SecurityContext` populated by `KeycloakFilter`.

## Web Frontend Structure (`frontend/track-nest-web`)

Next.js App Router with protected `/dashboard` layout:

```
app/
  /                         ← Public splash/login page
  /login/                   ← Keycloak redirect
  /dashboard/               ← Protected layout (auth-gated)
    /crime-reports/         ← List, [id] detail, [id]/edit
    /missing-persons/
    /emergency-requests/    ← User requests + responder view
    /guidelines/
    /accounts/              ← Emergency service accounts
```

Each backend service has a dedicated `*Service.ts` with an Axios instance whose **request interceptor** auto-attaches the JWT (refreshing before expiry via `authService`). Real-time emergency notifications use STOMP over SockJS connecting to `emergency-ops` with `?access_token=<jwt>` query param.

## Testing Conventions

All services use `@SpringBootTest` integration tests — full Spring context, no unit tests:
- **Testcontainers** spin up real Postgres + any other deps in CI (`TESTCONTAINERS_RYUK_DISABLED=true`).
- `@Transactional` on test methods rolls back after each test.
- **`SecuritySetup` utility** (`src/test/.../utils/SecuritySetup.java`) injects a mock `KeycloakPrincipal` into the security context for secured endpoint tests:
  ```java
  SecuritySetup.setUpSecurityContext(userId, username, email);
  ```

## Cross-Service Conventions

- **Java package root**: `project.tracknest.<service>` (e.g., `project.tracknest.criminalreports`).
- **Database init**: add schema changes in `database/` as `0N-<service>-<purpose>.sql` — docker-compose mounts them in lexical order. Changes only apply on fresh volumes.
- **Env-driven config**: all services read from env vars (see `docker-compose.yaml` for canonical dev values); key env vars: `DB_HOST/PORT/NAME/USERNAME/PASSWORD`, `KAFKA_SERVER`, `REDIS_URL`, `KEYCLOAK_AUTH_SERVER_URL`, `KEYCLOAK_PUBLIC_REALM`, `POD_NAME`/`POD_UID` (multi-pod session tracking).
- **Allowed origins**: each service reads `ALLOWED_ORIGINS` (comma-separated) for CORS.

## When Touching...

- **A `.proto` file**: regenerate Java stubs (`./gradlew generateProto` in `user-tracking`) and mobile stubs (`buf generate` in `frontend/TrackNest`). Envoy routes in `docker-compose/envoy/envoy.yaml` or Helm `charts/gateway/templates/envoy-configmap.yaml` may also need updates.
- **A Kafka topic name**: update producer, consumer, and `KAFKA_*_TOPIC` env vars in both `docker-compose.yaml` and helm values.
- **A database schema**: add a new `0N-<service>-<purpose>.sql` to `database/`; wipe the affected volume to apply (`docker compose down -v && docker compose up`).
- **Keycloak realm**: edit `keycloak/public-dev.json` or `keycloak/restricted-dev.json`; wipe `keycloak_postgres` volume for re-import.
- **A new K8s service (Helm)**: add a `cluster` entry in `charts/gateway/templates/envoy-configmap.yaml` + a `route` in the appropriate `virtual_host`; bump the configmap checksum annotation on the Envoy Deployment to trigger a pod roll.
- **Spatial / location logic**: use JTS + `hibernate-spatial`; PostGIS extensions are installed from the TimescaleDB-HA image.
