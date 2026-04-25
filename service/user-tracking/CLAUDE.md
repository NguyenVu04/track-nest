# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
./gradlew bootRun                                             # run the service
./gradlew build                                               # build (includes tests)
./gradlew test                                                # all tests
./gradlew test --tests 'FullyQualifiedClass.methodName'       # single test
./gradlew generateProto                                       # regenerate gRPC stubs into build/generated/source/proto/
```

Tests are full `@SpringBootTest` integration tests — they require a live PostgreSQL instance (port 15432), Redis, and Kafka. There are no unit tests with mocked repositories; the test suite connects to real infrastructure seeded from `database/`.

## Architecture

### Layer structure

```
controller/      ← @GrpcService implementations (thin: auth extract, delegate, respond)
domain/          ← business logic, split into subdomains
  <subdomain>/
    service/     ← public interfaces only
    impl/        ← package-private implementations + repository interfaces
core/
  entity/        ← JPA entities
  datatype/      ← Kafka message types, page tokens, security principals
  utils/         ← OtpGenerator, PageTokenCodec
configuration/   ← Spring config beans (security, redis, kafka, quartz, firebase, H3)
```

Repository interfaces are always package-private inside `impl/`. The `service/` package exposes only the interface — implementations are never referenced directly outside `impl/`.

### gRPC surface

Four `@GrpcService` controllers, each backed by a domain service interface:

| Controller | Service interface | Responsibility |
|---|---|---|
| `TrackerController` | `LocationQueryService`, `LocationCommandService` | Location streaming + history + updates |
| `TrackingManagerController` | `TrackingManagerService` | Family circle CRUD + membership |
| `NotifierController` | `NotifierService` | Mobile device registration + notification CRUD |
| `FamilyMessageController` | `FamilyMessengerService` | In-app family messaging |

Proto files live in `src/main/proto/`. After editing them, run `./gradlew generateProto`. The canonical protos shared with the mobile client are in `frontend/proto/` — keep both in sync when changing message shapes or adding RPCs.

### Location update fan-out

The path a location takes from mobile to all watching screens:

1. Mobile → `TrackerController.updateUserLocation` → `LocationCommandServiceImpl`
2. Saves `Location` row, updates `User.connected/lastActive`, publishes `LocationMessage` to Kafka topic `location-updated`, calls `AnomalyDetectorHandler.detectAnomaly`
3. `LocationQueryTrigger` (@KafkaListener on `location-updated`) → `LocationObserverImpl.sendTargetLocation`
4. If the target user's observers are on **this server**: write directly to `StreamObserver`
5. If on **another server**: look up which servers hold streams for that user via `GrpcSession` in Redis, publish a `ServerRedisMessage{method:"receiveLocationMessage"}` to each server's Redis pub/sub channel
6. Each server listens on its own channel (keyed by `serverIdProvider.getServerId()`); `ServerRedisMessageReceiver` dispatches to `LocationQuerySubscriber`

The same cross-server fan-out is used for family messages (`method:"receiveFamilyMessage"`).

### Anomaly detection (H3-based)

`AnomalyDetectorHandlerImpl` runs inside the location write transaction:
- Buckets visits by `(userId, dayOfWeek, hourOfDay)`; needs 20+ total visits before flagging anything
- Maps coordinates to H3 cell (resolution 8, ring size 1); a "known" location is a mature `CellVisit` in the ring
- If outside known cells: raises `AnomalyRun`, publishes `TrackingNotificationMessage` to `tracking-notification` topic
- Suppresses re-alerting while an open `AnomalyRun` exists or within 1 hour of the last one
- `CellVisitMaintenanceJob` and `AnomalyRunCleanupJob` do nightly housekeeping

### Kafka topics

Topics are referenced by array index in `${app.kafka.topics[N]}`:

| Index | Topic name | Producer | Consumer |
|---|---|---|---|
| 0 | `location-updated` | `LocationMessageProducerImpl` | `LocationQueryTrigger` |
| 1 | `notification-sent` | `NotificationSentMessageProducerImpl` | external |
| 2 | `tracking-notification` | `AnomalyDetectorHandlerImpl`, `DisconnectInactiveUsersJob` | `NotificationTrigger` (notifier domain) |
| 3 | `risk-notification` | (emergency-ops) | `NotificationTrigger` (notifier domain) |

### Security

Both the HTTP filter (`KeycloakFilter`) and gRPC interceptor (`GrpcSecurityInterceptor`) decode the JWT by Base64-decoding the payload — **signature verification is not performed**. Keycloak is trusted at the infrastructure boundary (Envoy/Nginx). The filter checks token expiry and that the user exists in the local DB. The gRPC interceptor also auto-provisions new users on first request.

`SecurityUtils.getCurrentUserId()` extracts the UUID from `SecurityContextHolder` and is used throughout controllers and services.

### Quartz jobs

All jobs use JDBC store (clustered, `isClustered=true`). Schema is pre-initialized (not auto-created). Job schedules are in `application.yaml` under `app.quartz.jobs`.

| Job | Schedule | Purpose |
|---|---|---|
| `DisconnectInactiveUsersJob` | every 3 min | Mark users disconnected after 8 min inactivity; publish disconnect notification |
| `UpdateGrpcSessionsJob` | every 3 min | Sync Redis `GrpcSession` to reflect currently connected servers |
| `CellVisitMaintenanceJob` | daily midnight | Prune stale cell visits, promote mature cells, recalculate bucket totals |
| `AnomalyRunCleanupJob` | daily midnight | Delete resolved anomaly runs past retention window |
| `LocationCleanupJob` | daily midnight | Delete location rows past retention window |

### Ports

| Port | Purpose |
|---|---|
| 18080 | HTTP (`/user-tracking` context path) |
| 19090 | gRPC |
| 8081 | Actuator (metrics, health) |
| 15432 | PostgreSQL (TimescaleDB) |

### Test conventions

Tests extend `@SpringBootTest` + `@Transactional`. The `SecuritySetup` utility class holds the UUIDs and family circle IDs matching the seed data in `database/`. Set up the security context per-test using `SecuritySetup.setUpSecurityContext(userId, username, email)` before calling controller methods directly.
