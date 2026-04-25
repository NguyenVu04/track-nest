# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Service Overview

`emergency-ops` is the emergency dispatch microservice in TrackNest. It connects users who need help with the nearest available emergency service, tracks real-time user locations during an incident, and manages safe zones. It is a Spring Boot 3.5 / Java 25 service using Gradle.

## Common Commands

```bash
./gradlew bootRun                                               # start service (port 28080)
./gradlew build                                                 # compile + test
./gradlew test                                                  # run all tests
./gradlew test --tests 'FullyQualifiedClass.methodName'        # single test
```

Swagger UI is available at `http://localhost:28080/swagger-ui.html` when running.

## Architecture

**Base package:** `project.tracknest.emergencyops`

**Layer order (strict):** `controller` → `domain` → `core`

```
configuration/   — infra wiring (security, Kafka, Redis, WebSocket, Quartz, OpenAPI)
controller/      — 5 REST controllers, thin delegation only
domain/          — feature-based modules, each with a Service interface + Impl + Repositories
core/
  entity/        — JPA entities (all have PostGIS POINT geometry columns)
  datatype/      — DTOs, PageResponse<T>, shared message types
```

### Feature Domains

| Domain | Responsibility |
|---|---|
| `emergencyrequestreceiver` | Create request; find nearest service via geo query; check request eligibility |
| `emergencyrequestmanager` | Accept/reject/close requests; update service location; list requests |
| `emergencyresponder` | Consume Kafka location updates; persist last location; push to WebSocket |
| `safezonemanager` | CRUD for safe zones owned by an emergency service |
| `safezonelocator` | Find nearest safe zones using PostGIS `ST_DWithin` (public endpoint) |

Each domain module owns its own Spring Data JPA repository interfaces — cross-domain sharing goes through the domain service layer, never repository-to-repository.

### Authentication (Keycloak)

`KeycloakFilter` (before the standard auth chain) decodes Bearer JWTs without Spring's native OIDC:
- Extracts `sub`, `preferred_username`, `email`, `phone_number`, `realm_access.roles`
- For `ROLE_EMERGENCY-SERVICE` tokens, auto-upserts an `EmergencyService` entity
- Populates `SecurityContextHolder` with a `KeycloakPrincipal` + `KeycloakUserDetails`

`KeycloakService` fetches full user profiles from Keycloak Admin API and caches them in Redis (10-min TTL, key: `user-profile#{userId}`). Call `getUserProfile(id)` anywhere you need Keycloak metadata — never call the Admin API directly.

Role-based routing:
- `ROLE_USER` — receiver + locator endpoints
- `ROLE_EMERGENCY-SERVICE` — manager + responder endpoints
- `/safe-zone-locator/**` — publicly accessible (no auth required)

### Real-time Flow

```
User location update (Kafka: location-updated)
  → EmergencyResponderServiceImpl.trackTarget()
  → update EmergencyServiceUser in DB
  → publish ServerRedisMessage to Redis channel (scoped to this server's ID)
  → ServerRedisMessageReceiver routes to EmergencyResponderSubscriber
  → SimpMessagingTemplate → WebSocket /user/{serviceId}/queue/user-location
```

Emergency request assignment:
```
POST /emergency-request-receiver/request
  → geo query finds nearest EmergencyService (ST_Distance)
  → creates EmergencyRequest (status: PENDING)
  → publishes AssignedEmergencyRequestMessage via Redis to the correct server
  → ServerRedisMessageReceiver routes to EmergencyRequestReceiverSubscriber
```

Multi-instance coordination uses `ServerIdProvider` (reads `POD_NAME`/`POD_UID` env vars) so Redis pub/sub channels are server-scoped. `WebSocketSessionService` tracks which WebSocket session lives on which server instance using Redis.

### Geospatial Conventions

Every core entity (`EmergencyRequest`, `EmergencyService`, `SafeZone`, `EmergencyServiceUser`) has `latitude`, `longitude`, and a derived `geom` (`org.locationtech.jts.geom.Point`). The `geom` column is a PostGIS POINT(longitude, latitude) (note X=lon, Y=lat). Complex geo queries use native SQL (not JPQL) with PostGIS functions:
- `ST_Distance` — find nearest service
- `ST_DWithin` — filter safe zones within radius

Always validate lat/lon at the entity level with `@Range`; the constraints are already present on existing entities.

### Kafka

| Direction | Topic (env var) | Payload |
|---|---|---|
| Consume | `location-updated` (`KAFKA_LOCATION_UPDATED_TOPIC`) | `LocationMessage` |
| Produce | `tracking-notification` (`KAFKA_TRACKING_NOTIFICATION_TOPIC`) | `TrackingNotificationMessage` |

### Emergency Request Status Lifecycle

`PENDING` → `ACCEPTED` or `REJECTED`; `ACCEPTED` → `CLOSED`

Status values are stored as a reference table (`EmergencyRequestStatus`), not a Java enum. Always load status by name via `EmergencyRequestReceiverEmergencyRequestStatusRepository` rather than hard-coding IDs.

## Tests

Tests live in `src/test/java/project/tracknest/emergencyops`. All are `@SpringBootTest` integration tests (full context). Use `SecuritySetup.setUpSecurityContext()` to inject a mock `KeycloakPrincipal` before exercising secured endpoints. Test classes group nested test classes by scenario (e.g., `@Nested class CreateEmergencyRequest`).

There are no unit tests — all tests are integration-level and `@Transactional`.

## Key Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | — | PostgreSQL connection |
| `DB_USERNAME`, `DB_PASSWORD` | — | PostgreSQL credentials |
| `KAFKA_SERVER` | `127.0.0.1:29092` | Kafka bootstrap |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis connection |
| `KEYCLOAK_SERVER_URL` | — | Keycloak base URL |
| `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET` | — | Service account for Admin API |
| `KEYCLOAK_PUBLIC_REALM` | — | Realm for JWT validation |
| `ALLOWED_ORIGINS` | `http://localhost` | CORS whitelist (comma-separated) |
| `POD_NAME`, `POD_UID` | — | Multi-instance server ID (K8s pod identity) |
