# TrackNest — Technical Overview

## 1. Tổng quan hệ thống

TrackNest là nền tảng **phòng chống bắt cóc và phản ứng khẩn cấp theo thời gian thực**, hoạt động theo mô hình microservices với ba backend độc lập, một web dashboard, và một mobile app. Hệ thống cho phép người dùng chia sẻ vị trí với gia đình, phát hiện hành vi bất thường tự động, kích hoạt SOS, và tra cứu báo cáo tội phạm/người mất tích.

---

## 2. Kiến trúc tổng thể

```
Mobile (Expo RN) ──gRPC-Web──► Envoy :8800 ──gRPC──► user-tracking :19090
                                    │
                                    ├──HTTP──► emergency-ops :28080
                                    └──HTTP──► criminal-reports :38080

Web (Next.js) ──HTTP──► Nginx :80 ──► Web :3000
                              └──► Keycloak :8080

emergency-ops ◄──Kafka──► user-tracking
criminal-reports ──Kafka──► (notification fan-out)

user-tracking ──Redis pub/sub──► user-tracking (multi-pod gRPC fan-out)
emergency-ops ──Redis pub/sub──► emergency-ops (multi-pod WebSocket fan-out)
```

---

## 3. Các tính năng chính

### 3.1 Theo dõi vị trí gia đình (user-tracking)

**Tính năng:**
- Người dùng tạo **Family Circle** (nhóm gia đình) và mời thành viên qua OTP.
- Mobile liên tục upload vị trí qua gRPC streaming; web/mobile khác nhận vị trí theo thời gian thực.
- Xem lịch sử vị trí (có thể lọc theo bán kính trung tâm).
- Chat nội bộ trong family circle (FamilyMessageController).

**Flow:**
1. App tạo/tham gia Family Circle qua OTP (lưu trong Redis, xóa ngay sau khi dùng).
2. Mỗi 5 giây hoặc di chuyển >0.0001°, app gọi `UpdateUserLocation` (gRPC unary).
3. Server lưu vào TimescaleDB hypertable, publish `LocationMessage` lên Kafka `location-updated`.
4. Kafka consumer `LocationQueryTrigger` kiểm tra xem observer đang ở pod nào:
   - Cùng pod → ghi thẳng vào `StreamObserver`.
   - Pod khác → publish `ServerRedisMessage` lên Redis channel của pod đó.
5. Thành viên trong circle đang stream (`StreamFamilyMemberLocations`) nhận vị trí mới.

### 3.2 Phát hiện hành vi bất thường (H3 Anomaly Detection)

**Tính năng:**
- Tự động phát hiện khi người dùng xuất hiện ở khu vực không quen thuộc.
- Gửi push notification (FCM) và thông báo trong app.

**Flow:**
1. Sau mỗi `UpdateUserLocation`, `AnomalyDetectorHandlerImpl` chạy bất đồng bộ (`@Async`).
2. Chuyển tọa độ sang **H3 hex cell** (resolution 8, ~460m²) và k-ring size 1 (7 ô liền kề).
3. Kiểm tra bucket thống kê `(userId, dayOfWeek, hourOfDay)`:
   - Chưa đủ 20 lần ghé thăm → bỏ qua (cold start).
   - Có `CellVisit` mature trong ring → bình thường.
   - Không có → bất thường, tạo `AnomalyRun`, publish `TrackingNotificationMessage` lên Kafka.
4. Kafka consumer `NotificationTrigger` gọi Firebase Admin SDK để push FCM đến tất cả thiết bị đã đăng ký.
5. Suppression: không cảnh báo lại trong vòng 1 giờ.

### 3.3 Khẩn cấp và SOS (emergency-ops)

**Tính năng:**
- Người dùng gửi yêu cầu khẩn cấp; hệ thống tự chọn dịch vụ khẩn cấp gần nhất.
- Emergency service nhận yêu cầu và xem vị trí thời gian thực của nạn nhân.
- Vòng đời: `PENDING → ACCEPTED/REJECTED → CLOSED`.
- Quản lý **Safe Zone** (vùng an toàn) với bán kính.
- API tìm safe zone gần nhất cho bất kỳ tọa độ nào.

**Flow SOS từ mobile:**
1. Người dùng kích hoạt SOS (tay/giọng nói/crash), màn hình đếm ngược 10s.
2. App POST `/emergency-ops/emergency-request-receiver/request` kèm tọa độ hiện tại.
3. Server dùng PostGIS `ST_Distance` tìm `EmergencyService` gần nhất trong DB.
4. Tạo `EmergencyRequest` (PENDING), publish `AssignedEmergencyRequestMessage` qua Redis đến đúng pod đang giữ WebSocket session của emergency service đó.
5. Emergency service nhận STOMP message `/user/{serviceId}/queue/emergency-request` → hiện trên web dashboard.
6. `emergency-ops` cũng publish `TrackingNotificationMessage` lên Kafka `tracking-notification` → `user-tracking` đẩy FCM đến mobile của nạn nhân.
7. Khi emergency service ACCEPT, STOMP message gửi về `/user/{senderId}/queue/emergency-request-status`.
8. Đồng thời, mỗi location update từ nạn nhân Kafka fan-out → emergency-ops → WebSocket `/user/{serviceId}/queue/user-location` → real-time map trên web.

**Voice SOS:**
- `useVoiceSosActivation` dùng `expo-speech-recognition` liên tục (continuous mode).
- Trigger phrases: "help me", "emergency", "emergency now", "send emergency", "tracknest emergency".
- Khi nhận diện → navigate đến `/sos?autoActivate=1`.

**Crash Detection:**
- Android: Native Kotlin foreground service đọc accelerometer, ngưỡng 3g.
- iOS/fallback: `expo-sensors` 10Hz, tính magnitude √(x²+y²+z²).
- Khi phát hiện va chạm → local notification → người dùng có thể dismiss hoặc gửi SOS.

### 3.4 Báo cáo tội phạm & người mất tích (criminal-reports)

**Tính năng:**
- Reporter tạo/quản lý báo cáo tội phạm (tọa độ, mức độ nghiêm trọng 1-5, số nạn nhân, nội dung HTML qua TinyMCE).
- Báo cáo người mất tích kèm ảnh.
- Quản lý tài liệu hướng dẫn (guidelines).
- **AI Chatbot** hỏi đáp dựa trên nội dung tài liệu guidelines.
- **Crime Heatmap**: xem mật độ tội phạm theo tọa độ và bán kính.
- **High-risk check**: kiểm tra một điểm có nằm trong vùng nguy hiểm không.
- **Dashboard analytics**: thống kê, xu hướng theo tuần, hotspots, phân nhóm theo loại/mức độ.

**AI Chatbot flow:**
1. Người dùng chọn tài liệu guidelines, tạo session (tối đa 15 tin nhắn).
2. Server đọc nội dung HTML từ MinIO, strip HTML tags → plain text context.
3. Gọi Gemini `gemini-2.0-flash` qua Spring AI với system prompt "chỉ trả lời từ tài liệu này".
4. Lịch sử chat (USER/MODEL) được lưu vào DB và truyền vào mỗi lần gọi tiếp theo.

### 3.5 Thông báo và quản lý thiết bị (user-tracking / Notifier)

**Tính năng:**
- Đăng ký/hủy FCM device token (gRPC `RegisterMobileDevice`).
- Xem/xóa danh sách `TrackingNotification` (anomaly, disconnect) và `RiskNotification` (emergency).
- Badge count trong app.

---

## 4. Công nghệ và lý do lựa chọn

### 4.1 gRPC + Protobuf (user-tracking ↔ mobile)

**Lý do chọn gRPC thay vì REST:**
- **Server-streaming** native: `StreamFamilyMemberLocations` và `ReceiveMessageStream` cần push liên tục từ server về mobile mà không cần polling. REST/WebSocket có thể làm được nhưng gRPC streaming tích hợp sẵn trong proto definition, type-safe hơn.
- **Hiệu suất binary**: Protobuf nhỏ hơn JSON ~3-10 lần, quan trọng khi gửi location batch mỗi 5 giây từ hàng nghìn thiết bị.
- **Code generation**: `buf generate` sinh stub TypeScript và `./gradlew generateProto` sinh stub Java từ cùng một source `.proto` → không thể desync API contract.
- **Envoy gRPC-Web bridge**: Mobile (HTTP/1.1) → Envoy → gRPC (HTTP/2) server, không cần thay đổi server implementation.

**Thay thế đã xem xét**: WebSocket thuần (thiếu type-safety, không có code gen), REST polling (latency cao, lãng phí bandwidth).

### 4.2 TimescaleDB + PostGIS (user-tracking, emergency-ops, criminal-reports)

**Lý do chọn TimescaleDB:**
- Bảng `location` là hypertable phân tán theo `timestamp` (1-day chunks) + 64 space partitions trên `user_id` → query lịch sử theo user và khoảng thời gian cực nhanh nhờ chunk pruning.
- TimescaleDB tự động compressor background, giảm storage cho dữ liệu location cũ.
- Vẫn là PostgreSQL → dùng được PostGIS, JPA/Hibernate như bình thường.

**Lý do chọn PostGIS:**
- `ST_Distance`, `ST_DWithin` để tìm emergency service gần nhất và safe zones → một câu SQL thay vì tính haversine trong application code.
- Generated column `geom geometry(Point,4326)` tự cập nhật từ lat/lon → không bao giờ có sự mismatch giữa float columns và geometry.

**Thay thế đã xem xét**: InfluxDB (không có PostGIS, không SQL), plain PostgreSQL (kém hơn về time-series queries khi data lớn).

### 4.3 H3 Hexagonal Indexing (Uber H3)

**Lý do chọn H3 thay vì geofencing tròn hoặc grid vuông:**
- **Uniform area**: Tất cả hex cell ở cùng resolution có diện tích xấp xỉ nhau (resolution 8 ≈ 460m²) → không có distortion theo latitude như grid vuông.
- **k-ring neighbor**: Tìm 6 ô lân cận chính xác và đối xứng bằng một lời gọi API → cho phép "gần kề" mà không cần query PostGIS tốn kém.
- **Bucketization bằng thuật toán**: không cần machine learning, không cần training data, chỉ cần đủ 20 lần ghé → phù hợp với hệ thống mới ít data.

**Thay thế đã xem xét**: Geofence tĩnh (phải config tay từng vùng), clustering ML (phức tạp, cần pipeline riêng), S2 geometry (tương tự nhưng H3 có thư viện Java/JS tốt hơn).

### 4.4 Kafka (event streaming)

**Lý do chọn Kafka thay vì gọi service trực tiếp:**
- **Decoupling**: `user-tracking` không cần biết `emergency-ops` tồn tại; chỉ publish `location-updated`. Nếu `emergency-ops` down, message vẫn được giữ và xử lý khi service recover.
- **Fan-out**: Một location message có thể được nhiều consumer xử lý (emergency tracking, notification fan-out, analytics) mà không cần thay đổi producer.
- **Throughput**: Kafka phù hợp với hàng nghìn location events/giây từ nhiều thiết bị.

**Known gap (được ghi nhận trong codebase)**: Không có transactional outbox → dual-write risk (DB write thành công nhưng Kafka publish fail). Không có DLQ hay idempotent producer.

**Thay thế đã xem xét**: RabbitMQ (không phù hợp với event log/replay), gRPC callback trực tiếp (tight coupling, không scale).

### 4.5 Redis (pub/sub + caching + OTP)

**Ba vai trò của Redis:**

1. **Multi-pod fan-out**: Mỗi pod subscribe channel riêng (keyed by `POD_NAME`/`POD_UID`). Khi location update đến Kafka, consumer kiểm tra `GrpcSession` registry trong Redis để biết observer đang ở pod nào → publish đến đúng pod. Không cần sticky session ở load balancer.

2. **Session registry**: `GrpcSessionService` và `WebSocketSessionService` lưu mapping `userId → serverId` trong Redis với TTL. `UpdateGrpcSessionsJob` và `UpdateWebSocketSessionsJob` (Quartz, mỗi 3 phút) dọn stale entries.

3. **OTP storage**: Family circle invitation OTP lưu với TTL ngắn, xóa bằng Lua script atomic (fetch-and-delete) khi dùng → không thể replay.

4. **Keycloak profile cache**: `user-profile#{userId}` TTL 10 phút → giảm gọi Keycloak Admin API mỗi request.

**Thay thế đã xem xét**: Hazelcast (phức tạp hơn, overkill), database-backed session (quá chậm cho pub/sub), sticky sessions (không scale tốt với K8s).

### 4.6 Spring AI + Google Gemini (criminal-reports chatbot)

**Lý do chọn Spring AI:**
- Abstraction layer cho LLM → có thể đổi provider (Gemini → OpenAI) chỉ bằng config.
- Tích hợp native vào Spring Boot (bean injection, autoconfiguration).
- `ChatClient` builder pattern cho phép build conversation history sạch.

**Lý do chọn Gemini 2.0 Flash:**
- Context window lớn → đọc toàn bộ tài liệu guidelines dài trong một lần gọi.
- Nhanh và rẻ hơn các model lớn → phù hợp với chatbot realtime.

**Thay thế đã xem xét**: RAG với vector DB (phức tạp hơn nhiều, overkill cho guidelines ngắn), fine-tuning (không cần thiết vì context đã đủ).

### 4.7 Keycloak (Identity Provider)

**Lý do chọn Keycloak thay vì tự build auth:**
- **OIDC/OAuth2 chuẩn**: PKCE flow cho web, token refresh tự động.
- **Hai realm độc lập**: `public-dev` (end users, open registration) và `restricted-dev` (reporters, emergency services, closed) → phân tách quyền hoàn toàn mà không cần code.
- **Admin Client**: `emergency-ops` dùng Keycloak Admin API để lấy full user profile (tên, avatar, phone) → không cần sync user data sang service.
- **Envoy JWT filter**: validate signature tại edge, không cần mỗi service tự verify.

**Thay thế đã xem xét**: Auth0 (vendor lock-in, tốn tiền), tự build JWT service (security risk, không có các tính năng như realm, client scopes).

### 4.8 Envoy (Edge Proxy + gRPC-Web Bridge)

**Lý do chọn Envoy:**
- **gRPC-Web translation**: Mobile browser/React Native không dùng được gRPC native (HTTP/2 thuần) vì thiếu control plane. Envoy nhận gRPC-Web (HTTP/1.1 với custom framing) và translate sang gRPC (HTTP/2) cho backend.
- **JWT filter tại edge**: `jwt_authn` filter validate token trước khi request đến service → không service nào bị gọi với token invalid.
- **Unified ingress**: Một endpoint (:8800) cho cả REST và gRPC, mobile chỉ cần config một base URL.

**Thay thế đã xem xét**: Nginx (không có gRPC-Web bridge native), Kong (phức tạp hơn cho gRPC), grpc-gateway (chỉ cho Go).

### 4.9 WebSocket/STOMP (emergency-ops ↔ web)

**Lý do chọn STOMP thay vì WebSocket thuần:**
- **Destination routing**: `/user/{id}/queue/emergency-request` routing được Spring handle tự động với `SimpMessagingTemplate.convertAndSendToUser()` → không cần tự quản lý connection registry.
- **SockJS fallback**: Hỗ trợ môi trường không có WebSocket native (proxies, corporate firewalls).
- **Auth qua query param**: STOMP handshake (HTTP Upgrade) không gửi được custom headers → dùng `?access_token=<jwt>`, Envoy recognize cả hai cách.

**Thay thế đã xem xét**: Server-Sent Events (unidirectional, không phù hợp), polling (latency cao), WebSocket thuần (phải tự implement pub/sub routing).

### 4.10 Quartz Scheduler (maintenance jobs)

**Lý do chọn Quartz thay vì Spring `@Scheduled`:**
- **Clustered execution**: Với Quartz JDBC store (`tables_postgres.sql`), nhiều pod cùng chạy nhưng mỗi job chỉ chạy trên một pod → không bị duplicate (e.g., `DisconnectInactiveUsersJob` chạy mỗi 3 phút chỉ chạy một lần dù có 3 pods).
- **Durable jobs**: Job definition lưu trong DB, không mất khi pod restart.

**Thay thế đã xem xét**: Spring `@Scheduled` (không có cluster-aware dedup, mỗi pod đều chạy), K8s CronJob (overhead infra, khó share state với service).

### 4.11 MinIO / DigitalOcean Spaces (object storage)

**Lý do chọn S3-compatible storage:**
- HTML content của crime reports và ảnh người mất tích có thể lớn → không lưu vào DB.
- MinIO S3-compatible API → có thể đổi sang DigitalOcean Spaces hoặc AWS S3 chỉ bằng endpoint config.
- Generated presigned URL hoặc proxy qua `FileController` tùy use case.

### 4.12 Expo React Native (mobile)

**Lý do chọn Expo:**
- **Managed workflow + EAS**: Build Android/iOS không cần Mac riêng cho Android.
- **expo-location + expo-task-manager**: Background location tracking với managed API.
- **Native modules**: `NativeLocationModule` (Kotlin foreground service) và `CrashDetectionModule` có thể tích hợp qua Expo custom native modules.
- **expo-speech-recognition**: Voice SOS không cần implement Speech API từ đầu.

**Thay thế đã xem xét**: Flutter (Dart ecosystem, khó tích hợp native JS gRPC libs), bare React Native (mất Expo ecosystem, phức tạp hơn).

### 4.13 Next.js + React 19 (web frontend)

**Lý do chọn Next.js:**
- **App Router**: Layouts lồng nhau (`/dashboard` layout tự wrap auth gate) → ít boilerplate.
- **Server Components + Vercel**: Deploy static + server rendering tối ưu, không cần cấu hình infra.
- **next-intl**: i18n (EN/VI) tích hợp sẵn, locale từ localStorage.

### 4.14 Observability Stack (Micrometer + OTel + Prometheus)

- **Micrometer**: Abstraction cho metrics → dễ đổi backend (Prometheus, Datadog).
- **OpenTelemetry OTLP**: Trace propagation với `X-Correlation-ID` end-to-end.
- **Helm chart**: Bundles `kube-prometheus-stack` + Loki + Promtail → không cần setup monitoring riêng trên K8s.

---

## 5. Luồng dữ liệu quan trọng

### 5.1 Location Update → Real-time Family Tracking

```
Mobile App
  │ UpdateUserLocation (gRPC)
  ▼
user-tracking (pod A)
  ├─ Save → TimescaleDB (location hypertable)
  ├─ Publish → Kafka: location-updated
  └─ AnomalyDetector (async)
        └─ H3 check → Kafka: tracking-notification (nếu anomaly)

Kafka: location-updated
  └─ LocationQueryTrigger (user-tracking)
        ├─ Observer trên pod A → ghi StreamObserver trực tiếp
        └─ Observer trên pod B → Redis pub/sub → pod B → StreamObserver

StreamObserver (pod B)
  └─ gRPC streaming → Mobile app của thành viên khác trong family circle
```

### 5.2 SOS Request → Emergency Response

```
Mobile (SOS) ──POST /emergency-request──► emergency-ops
  ├─ PostGIS: tìm EmergencyService gần nhất
  ├─ Tạo EmergencyRequest (PENDING)
  ├─ Redis pub/sub → pod giữ WebSocket của service đó
  │     └─ STOMP → /user/{serviceId}/queue/emergency-request
  │              → Web dashboard (Emergency Service)
  └─ Kafka: tracking-notification
        └─ user-tracking: FCM push → Mobile nạn nhân

Mobile upload location (mỗi 5s) ──gRPC──► user-tracking
  └─ Kafka: location-updated
        └─ emergency-ops LocationMessageConsumer
              ├─ Update EmergencyServiceUser DB
              └─ Redis pub/sub → pod giữ WS
                    └─ STOMP → /user/{serviceId}/queue/user-location
                             → Real-time map trên web dashboard
```

### 5.3 AI Chatbot

```
Web (chọn guidelines document)
  ├─ POST /chatbot/session (documentId)
  │     └─ Tạo ChatSession, trả sessionId
  └─ POST /chatbot/message {sessionId, message}
        ├─ Đọc content HTML từ MinIO
        ├─ Strip HTML → plain text
        ├─ Build conversation history từ DB
        ├─ Gọi Gemini 2.0 Flash (Spring AI ChatClient)
        └─ Lưu USER + MODEL messages → trả response
```

---

## 6. Bảo mật

| Layer | Cơ chế |
|---|---|
| Edge | Envoy `jwt_authn` validate JWT signature vs Keycloak JWKS |
| Transport | HTTPS/TLS (Nginx/Envoy), gRPC plaintext nội bộ |
| Service | `KeycloakFilter` / `GrpcSecurityInterceptor` populate SecurityContext |
| Realm | `public-dev` (users) vs `restricted-dev` (reporters, emergency services) |
| API ownership | `X-User-Id` header + JWT `sub` cho crime report ownership |
| OTP | Atomic Redis fetch-and-delete (Lua script), short TTL |
| Profile cache | Keycloak Admin responses cached Redis 10 phút |

**Known gaps (thừa nhận trong codebase):**
- `X-User-Id` không được validate match với JWT `sub` → frontend phải gửi đồng bộ.
- Secrets trong `docker-compose.prod.yaml` commit plaintext → cần rotate.
- gRPC backend plaintext (no mTLS giữa Envoy ↔ user-tracking).
- Dual-write risk Kafka (không có transactional outbox).
