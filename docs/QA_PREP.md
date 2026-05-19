# TrackNest — Câu hỏi & Gợi ý trả lời (Q&A Prep)

> Tổng hợp 80 câu hỏi giảng viên có thể đặt ra, phân theo 12 chủ đề.
> Câu khó nhất: **Q8, Q9, Q17, Q18, Q48, Q71, Q74** — đây là các trade-off và known gap.
> Khi bị hỏi về điểm yếu, hãy trả lời thành thật: *"Chúng tôi biết điểm yếu này, giải pháp đúng là X, nhưng chưa implement vì Y."*

---

## I. Kiến trúc tổng thể

**Q1. Tại sao chọn microservices thay vì monolith cho hệ thống này? Trade-off là gì?**

Chúng tôi chọn microservices vì:
- **Domain isolation thực sự**: location tracking (high-throughput, TimescaleDB), emergency ops (stateful WebSocket), crime reports (file storage + AI) — mỗi domain có đặc thù riêng về storage và scale.
- **Independent deployment**: thay đổi AI chatbot không ảnh hưởng real-time location pipeline.
- **Technology fit**: `user-tracking` cần gRPC; `criminal-reports` cần Spring AI; `emergency-ops` cần STOMP WebSocket — khó gộp vào 1 service.

Trade-off nhận ra:
- Tăng độ phức tạp vận hành (Kafka, Redis coordination, distributed tracing).
- Cross-service calls phức tạp hơn function call.
- Với team 3 người, monolith sẽ đơn giản hơn để phát triển ban đầu.

---

**Q2. Ba service được phân chia theo tiêu chí gì? Tại sao không gộp `emergency-ops` và `user-tracking`?**

Phân chia theo **domain boundary**:
- `user-tracking`: owns location data, family relationships, push tokens — high-frequency writes (location updates), gRPC streaming.
- `emergency-ops`: owns emergency request lifecycle, responder assignment, safe zones — stateful WebSocket sessions, business workflow.
- `criminal-reports`: owns public safety content, file storage, AI — read-heavy, MinIO-coupled.

Lý do không gộp `emergency-ops` + `user-tracking`: tuy cả hai liên quan đến location, nhưng `user-tracking` là **infrastructure** (data pipeline), còn `emergency-ops` là **business logic** (who responds, when, how). Gộp lại tạo god service với quá nhiều responsibility.

---

**Q3. Service nào là bottleneck khi tải cao? Bạn scale service đó như thế nào?**

`user-tracking` là bottleneck rõ nhất — nhận location updates liên tục từ tất cả mobile clients.

Scale strategy:
- **Horizontal scaling** (nhiều pods) — đã hỗ trợ qua Redis pub/sub fan-out và Quartz JDBC clustering.
- **Kafka partitioning**: `location-updated` topic có thể partition theo `user_id` → parallel consumption.
- **TimescaleDB space partitioning**: 64 partitions trên `user_id` → parallel inserts.
- **Giới hạn chưa giải quyết**: Redis pub/sub single-threaded per channel — sẽ bottleneck khi >10K concurrent streams.

---

**Q4. Nếu phải thêm service thứ 4 (ví dụ: notification hub), bạn sẽ tổ chức nó như thế nào?**

Notification hub subscribe các Kafka topics hiện có:
- `tracking-notification` (H3 anomaly từ `user-tracking`)
- `risk-notification` (emergency risk từ `emergency-ops`)

Service này chịu trách nhiệm: routing đến đúng channel (FCM push, SMS, email), user preferences (opt-in/out per category), rate limiting notifications per user.

Hiện tại FCM logic nằm rải rác trong `user-tracking` — tách ra notification hub giúp centralize và dễ extend hơn.

---

**Q5. Tại sao dùng Envoy làm API gateway thay vì Kong, AWS API Gateway?**

Lý do chọn Envoy:
- **Native gRPC-Web transcoding** built-in: mobile dùng gRPC-Web, Envoy tự translate thành native gRPC — không cần thêm layer.
- **`jwt_authn` filter**: validate JWT signature tại edge, không cần code trong service.
- **Phù hợp K8s**: là sidecar mặc định của Istio, tích hợp tốt với Helm chart hiện có.

Trade-off so với Kong: Envoy config YAML phức tạp và verbose hơn. Kong có UI quản lý plugin dễ hơn cho team không quen Envoy.

---

**Q6. Nginx và Envoy có vai trò gì khác nhau trong hệ thống này?**

| | Nginx | Envoy |
|---|---|---|
| **Layer** | HTTP reverse proxy | gRPC-Web gateway + JWT auth |
| **Handles** | Web frontend routing, Keycloak redirect | Backend API routing, JWT validation |
| **Port** | :80 | :8800 |
| **JWT** | Không | Có (`jwt_authn` filter) |
| **gRPC** | Không | Có (HTTP/2 + transcoding) |

Nginx phục vụ end-user browser traffic. Envoy phục vụ mobile app và web app khi gọi backend APIs.

---

## II. Bảo mật & Xác thực

**Q7. Envoy validate JWT rồi, tại sao các service backend vẫn phải parse JWT?**

Envoy chỉ **block invalid tokens** — không forward parsed claims vào HTTP headers theo chuẩn.

Các service cần:
- `sub` (UUID) → populate `SecurityContext` → `SecurityUtils.getCurrentUserId()`.
- `realm_access.roles` → Spring Security authorization (`@PreAuthorize`, role checks).
- `preferred_username`, `email` → auto-provisioning user record trên first request.

Không parse JWT trong service → không biết ai đang gọi → không thể enforce authorization.

---

**Q8. ⚠️ Các backend service có verify chữ ký JWT không? Nếu không, rủi ro là gì?**

**Không** — `KeycloakFilter` và `GrpcSecurityInterceptor` chỉ Base64-decode JWT payload và check `exp` claim. Chữ ký (phần thứ 3 của JWT) không bao giờ được validate trong service.

Rủi ro: nếu attacker có thể gửi request trực tiếp đến backend service **bypass Envoy** (ví dụ: internal network access, misconfigured firewall), họ có thể forge JWT với bất kỳ `sub` và `roles` nào.

Toàn bộ security model **tin tưởng hoàn toàn vào Envoy** là trust boundary duy nhất. Đây là intentional design nhưng cần network policy chặt: backend services chỉ accept traffic từ Envoy, không expose port ra ngoài.

---

**Q9. ⚠️ `criminal-reports` có header `X-User-Id` và JWT `sub`. Điều gì xảy ra nếu frontend gửi `X-User-Id` sai?**

Backend **không cross-check** `X-User-Id` với JWT `sub`. Code chỉ đọc `@RequestHeader("X-User-Id")` trực tiếp.

Hậu quả: nếu authenticated user A gửi request với `X-User-Id` của user B, họ có thể xóa/sửa report của B (nếu biết `reportId`). Đây là authorization gap thực sự.

Giải pháp đúng: trong mỗi controller, so sánh `userId` từ header với `SecurityUtils.getCurrentUserId()` từ JWT. Nếu không khớp → 403 Forbidden.

---

**Q10. Tại sao STOMP WebSocket dùng `?access_token=<jwt>` trong query string thay vì Authorization header?**

Giới hạn kỹ thuật của WebSocket upgrade: browser không cho phép set custom HTTP headers (như `Authorization`) trong `new WebSocket(url)` call. Query string là workaround phổ biến nhất.

**Rủi ro**: token lộ trong server access log, browser history, proxy logs.

**Giải pháp tốt hơn** (chưa implement): gửi token trong STOMP CONNECT frame sau handshake — server validate ở STOMP layer thay vì HTTP layer.

---

**Q11. Hai realm Keycloak bảo vệ gì? Người dùng bình thường có thể tự register vào `restricted-dev` không?**

- `public-dev`: open registration → end users tự tạo tài khoản qua app.
- `restricted-dev`: closed registration → chỉ admin tạo tài khoản thủ công cho Reporter, Emergency Service, Admin.

Envoy check realm bằng cách validate JWT `iss` claim (issuer URL chứa realm name). Token từ sai realm bị reject ngay tại Envoy — service không bao giờ nhận được.

---

**Q12. Nếu Keycloak bị compromise, toàn bộ hệ thống bị ảnh hưởng như thế nào?**

Keycloak là **single point of failure cho authentication**. Nếu bị compromise:
- Attacker có thể issue JWT hợp lệ với bất kỳ role nào → toàn quyền hệ thống.
- Envoy tin tưởng JWT signed bởi Keycloak private key → không detect được.

Mitigation cần có: Keycloak HA (clustered), key rotation policy ngắn, audit log mọi admin action, anomaly detection cho token issuance patterns.

---

**Q13. Secrets trong `docker-compose.prod.yaml` đang committed vào git. Đây có phải vấn đề không?**

Có — đây là **critical security issue**. CLAUDE.md tự nhận "treat as compromised; rotate before any real deployment."

Giải pháp đúng cho production:
- **K8s**: External Secrets Operator + HashiCorp Vault / AWS Secrets Manager.
- **CI/CD**: GitHub Secrets inject vào `values-secrets.yaml` lúc deploy (đã làm một phần trong `deploy.yaml`).
- **Git history**: ngay cả khi xóa file, secret vẫn trong git history → cần `git filter-branch` + revoke/rotate all secrets.

---

## III. Real-time & Messaging

**Q14. Giải thích cơ chế fan-out location update khi 2 user ở 2 pod khác nhau.**

```
Mobile (User A) → gRPC UpdateUserLocation → TrackerController
  → save to TimescaleDB
  → publish to Kafka "location-updated"

Kafka Consumer (LocationQueryTrigger) trên Pod 1:
  → check Redis GrpcSession: "User B's observer đang ở Pod 2"
  → publish ServerRedisMessage{method:"receiveLocationMessage"} → Redis channel của Pod 2

Pod 2 Redis subscriber nhận message:
  → lookup StreamObserver của User B
  → gọi observer.onNext(location) → gRPC stream đến Mobile User B
```

`UpdateGrpcSessionsJob` (Quartz, 3 phút/lần) sync registry Pod ↔ Redis để mapping luôn accurate.

---

**Q15. Nếu một pod crash đột ngột, các GrpcSession của nó trong Redis sẽ bị orphan bao lâu?**

Tối đa **3 phút** — thời gian đến lần chạy tiếp theo của `UpdateGrpcSessionsJob`.

Job so sánh active in-memory sessions với Redis registry. Pod đã crash → sessions của nó biến mất khỏi in-memory → job xóa stale entries khỏi Redis.

Trong 3 phút đó, location messages gửi đến channel của pod chết sẽ bị mất (không có consumer nào nhận).

---

**Q16. Tại sao dùng Kafka thay vì gọi trực tiếp từ `user-tracking` sang `emergency-ops`?**

**Decoupling**: `user-tracking` không cần biết `emergency-ops` tồn tại. Thêm consumer mới (notification hub, analytics) không cần thay đổi producer.

**Backpressure**: Kafka buffer messages khi `emergency-ops` quá tải — không làm chậm location pipeline.

**Replay**: nếu `emergency-ops` crash và restart, có thể replay messages từ Kafka offset.

Trade-off: thêm latency (~vài trăm ms đến vài giây) và operational complexity.

---

**Q17. ⚠️ Kafka trong project có DLQ không? Consumer xử lý lỗi thì sao?**

**Không có DLQ, không có retry policy**. Nếu consumer (`LocationQueryTrigger`, `EmergencyRequestKafkaConsumer`) throw exception khi xử lý message:
- Message có thể bị skip (tùy `AckMode` config).
- Không có DLQ để inspect failed messages.
- Silent data loss.

Đây là known gap trong CLAUDE.md. Giải pháp: Spring Kafka `SeekToCurrentErrorHandler` với exponential backoff + DLQ topic, hoặc dùng `@RetryableTopic` annotation.

---

**Q18. ⚠️ Dual-write risk nghĩa là gì? Khi nào nó xảy ra trong TrackNest?**

Dual-write: ghi vào 2 systems (DB + Kafka) trong cùng một request mà không có distributed transaction.

**Trong `user-tracking`** (`LocationCommandServiceImpl`):
```java
@Transactional  // chỉ bao DB transaction
locationRepository.save(location);  // DB commit
messageProducer.produce(message);   // Kafka send — ngoài DB transaction
```

Scenarios thất bại:
- DB commit OK, Kafka broker down → location saved nhưng không ai được notify (silent loss).
- Kafka send OK, DB rollback (runtime exception) → notification gửi đi nhưng location không được lưu.

**Giải pháp đúng**: Transactional Outbox Pattern — write event vào bảng `outbox` cùng DB transaction, CDC (Debezium) đọc và publish Kafka.

---

**Q19. Transactional Outbox Pattern giải quyết dual-write như thế nào?**

```
BEGIN TRANSACTION
  INSERT INTO location (...)        ← domain write
  INSERT INTO outbox_events (...)   ← event write (cùng transaction)
COMMIT

CDC Process (Debezium):
  Reads binlog → "outbox_events" row inserted
  Publishes to Kafka
```

Atomicity đảm bảo bởi DB ACID — không bao giờ có "DB có data nhưng không có event" hoặc ngược lại. CDC độc lập với application logic.

---

**Q20. gRPC streaming có timeout không? Client disconnect thì server xử lý thế nào?**

gRPC có **deadline** per-call, set bởi client. Nếu client không set deadline, stream tồn tại vô thời hạn (cho đến disconnect).

Khi client disconnect đột ngột: `StreamObserver.onError(StatusRuntimeException)` được trigger phía server. `GrpcSession` tương ứng được mark inactive.

`DisconnectInactiveUsersJob` (3 phút) cleanup sessions không còn active (inactivity > 8 phút). 8 phút > 3 phút interval để tránh race condition: session chưa kịp reconnect đã bị xóa.

---

**Q21. Tại sao dùng gRPC cho mobile thay vì REST?**

| | gRPC | REST |
|---|---|---|
| **Streaming** | Native server-streaming, bidirectional | Cần SSE hoặc polling |
| **Payload** | Protobuf binary (nhỏ hơn ~30-50%) | JSON text |
| **Type safety** | Schema từ `.proto` → compile-time errors | Không có (OpenAPI optional) |
| **Mobile battery** | Ít connections hơn (1 stream vs nhiều polls) | Polling tốn battery |

Trade-off: gRPC-Web cần Envoy bridge, debugging khó hơn REST (không dùng được curl trực tiếp).

---

## IV. Database & Spatial

**Q22. TimescaleDB là gì? Tại sao không dùng PostgreSQL thông thường?**

TimescaleDB là extension của PostgreSQL, thêm:
- **Hypertable**: auto-partition bảng theo thời gian → query chỉ đọc relevant chunks.
- **Chunk pruning**: tự động xóa chunks cũ (thay vì `DELETE WHERE timestamp < ...` chạy full scan).
- **Compression**: compress chunks cũ (lossless) → tiết kiệm storage 90%+.
- **Time-series functions**: `time_bucket()`, `first()`, `last()` tối ưu cho analytics.

Với location data (millions rows/day), TimescaleDB partition theo ngày → query location trong 1 giờ chỉ đọc 1-2 chunks thay vì full table scan.

---

**Q23. Hypertable `location` được partition như thế nào? Tại sao 64 partitions?**

```sql
SELECT create_hypertable('location', 'timestamp',
  chunk_time_interval => INTERVAL '1 days',  -- time dimension
  partitioning_column => 'user_id',
  number_partitions => 64);                  -- space dimension
```

**Time partitioning** (1 day): mỗi ngày tạo 1 chunk mới, queries có `WHERE timestamp BETWEEN ...` chỉ scan relevant chunks.

**Space partitioning** (64, user_id): phân tán writes của các users khác nhau ra nhiều files → parallel inserts, ít lock contention.

64 là trade-off: đủ lớn để parallelism, không quá lớn để tránh overhead metadata management. Thường set bằng số CPU cores × 2.

---

**Q24. PostGIS `ST_Distance` vs `ST_DWithin` — khi nào dùng cái nào?**

- **`ST_DWithin(geom, point, radius)`**: sử dụng **GiST spatial index** → O(log n). Dùng để **filter**: "tìm tất cả records trong bán kính X".
- **`ST_Distance(geom, point)`**: tính exact distance cho mọi row **trước** khi filter → O(n) nếu không có index support. Dùng để **sort**: "sắp xếp theo khoảng cách gần nhất".

Pattern đúng trong TrackNest:
```sql
WHERE ST_DWithin(geom, :point, :radius)  -- dùng index, filter nhanh
ORDER BY ST_Distance(geom, :point)       -- sort kết quả đã filter
```

---

**Q25. Column `geom geometry(Point,4326) GENERATED ALWAYS AS ...` nghĩa là gì?**

```sql
geom geometry(Point,4326) GENERATED ALWAYS AS (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
) STORED
```

**Generated column**: PostgreSQL tự tính giá trị từ `longitude` và `latitude` mỗi khi insert/update. Application chỉ write float columns — không bao giờ write `geom` trực tiếp.

`4326` = EPSG:4326 = WGS84 coordinate system (GPS standard). `ST_MakePoint(lon, lat)` chú ý thứ tự longitude trước latitude (X trước Y trong PostGIS).

GiST index được đặt trên `geom` column → tất cả spatial queries tự dùng index mà không cần code thêm.

---

**Q26. Tại sao không có migration framework (Flyway/Liquibase)? Rủi ro là gì?**

SQL init scripts (`database/0N-<service>-init.sql`) chỉ chạy khi volume **hoàn toàn mới** (`docker-entrypoint-initdb.d/`). Thêm column mới phải `docker compose down -v` → **mất toàn bộ data**.

Rủi ro:
- Không có versioned migration history → không rollback schema.
- Team member A thêm column mới, member B pull code nhưng volume cũ → runtime errors khó debug.
- Production: schema drift giữa instances nếu không sync.

Đây là acceptable tradeoff cho prototype/demo. Production cần Flyway/Liquibase.

---

**Q27. Không có soft delete. Khi xóa một báo cáo tội phạm, dữ liệu mất vĩnh viễn?**

Đúng — hard delete, không có `deleted_at` column hay `is_deleted` flag.

Hậu quả: không có audit trail, không thể recover nếu xóa nhầm, không thể phân tích deleted content.

Trường hợp ngoại lệ: `EmergencyRequest` dùng `status` column (PENDING/ACCEPTED/REJECTED/CLOSED) thay vì xóa — đây là append-only bằng status transitions, tốt hơn.

Giải pháp cho crime reports: soft delete với `deleted_at TIMESTAMPTZ` + filter trong queries, hoặc event sourcing để giữ lịch sử đầy đủ.

---

**Q28. Nếu hai service đọc cùng user data, đó có phải shared database anti-pattern không?**

Không — mỗi service có **database riêng biệt hoàn toàn**. Không có shared tables.

User data được truy cập theo cách khác nhau:
- `emergency-ops` và `criminal-reports` auto-provision user record **local** khi user đầu tiên authenticate.
- Cần full user profile → gọi **Keycloak Admin Client API** (HTTP), cache trong Redis 10 phút.
- Không service nào kết nối trực tiếp vào DB của service khác.

---

## V. H3 Anomaly Detection

**Q29. H3 là gì? Tại sao dùng hexagonal grid thay vì bounding box?**

**Uber H3**: hệ thống phân chia bề mặt Trái Đất thành các ô hexagon phân cấp (15 levels).

Tại sao hexagon hơn square:
- **Đồng đều**: khoảng cách từ center đến tất cả 6 neighbors bằng nhau. Square grid có corner neighbors xa hơn edge neighbors (~40%).
- **k-ring**: mở rộng k cells ra xung quanh → vùng coverage hình hexagon đồng đều.
- **Compact**: ít ô hơn để cover cùng diện tích với accuracy tương đương.

Điều này quan trọng cho anomaly detection: "bình thường" của user là cluster các ô họ thường xuyên ở — hexagon cluster tự nhiên hơn square cluster.

---

**Q30. Resolution 8 nghĩa là gì? Diện tích bao nhiêu?**

H3 có 16 levels (0–15): level 0 là toàn cầu, level 15 là ~1m².

**Resolution 8**: diện tích ~0.737 km² (khoảng 460m × 460m trên thực tế — số trong DEMO_FLOW là "~460m²" nhưng thực ra là ~0.74 km²).

Lý do chọn res 8:
- Đủ nhỏ để phân biệt "ở nhà" vs "ở công ty" vs "ở quán cà phê gần nhà".
- Đủ lớn để absorb GPS noise (độ chính xác GPS thường ±3–10m, đôi khi ±50m trong nhà).

---

**Q31. Tại sao cần 20 lần ghé thăm mới detect anomaly? Nếu user mới cài app thì không được bảo vệ?**

20 visits = ngưỡng **statistical significance** để xác định "normal behavior". Dưới 20 → không đủ data để biết đây là địa điểm bình thường hay bất thường.

**Cold start problem** là real limitation. Giải pháp có thể:
1. **Seed từ calendar**: user nhập lịch làm việc → pre-populate buckets.
2. **Lower threshold với confidence interval**: detect với 5 visits nhưng chỉ alert nếu confidence > 80%.
3. **Opt-in period**: thông báo user "đang học behavior" trong 1 tuần đầu.

---

**Q32. Bucket (userId, dayOfWeek, hourOfDay) có bao nhiêu combinations? Sparse data không?**

7 × 24 = **168 buckets** per user. Nhưng mỗi bucket cũng partition theo H3 cell.

Sparse data là vấn đề thực tế: user chỉ đi 5–10 locations thường xuyên → phần lớn 168 × (số H3 cells) buckets sẽ có 0 visits. Đây không phải lỗi — bucket 0 visits = "chưa từng đến đây giờ này ngày này" → nếu user xuất hiện ở đó, là bất thường (nếu cells khác trong k-ring cũng có đủ 20 visits).

---

**Q33. `AnomalyRun` suppress alert 1 giờ. Nếu người bị bắt cóc vẫn ở vị trí bất thường sau 1 giờ?**

Sau 1 giờ, `AnomalyRunCleanupJob` (daily midnight) dọn entries → anomaly có thể trigger lại. Nhưng nếu captive ở cùng địa điểm → sau 1 giờ sẽ alert lại → alert tiếp theo sau 1 giờ nữa...

Cải tiến đề xuất: **escalation policy** — nếu cùng user vẫn ở vị trí bất thường sau 1 giờ, rút ngắn interval xuống 15 phút thay vì đợi daily cleanup.

---

**Q34. Anomaly detection chạy synchronous trong `@Transactional`. Nếu detection chậm, request bị block?**

Đúng — detection logic nằm trong cùng transaction với location save. Nếu H3 lookup + DB query chậm (cold cache, slow DB), toàn bộ `updateUserLocation` gRPC call bị block.

**Giải pháp tốt hơn**: async processing.
```
updateUserLocation → save location → return OK immediately
  → publish to internal topic → anomaly detector consumer processes async
```
Tradeoff: alert đến chậm hơn vài giây, nhưng location update không bị block.

---

## VI. AI Integration

**Q35. Spring AI là gì? Khác gì so với gọi Gemini API trực tiếp?**

Spring AI là **abstraction layer** cho AI models trong Spring Boot ecosystem:
- **Portability**: switch từ Gemini sang OpenAI/Claude chỉ cần đổi dependency + config, không đổi code.
- **Prompt templates**: `PromptTemplate` với placeholder substitution.
- **Output parsers**: parse structured output (JSON, bean) từ model response.
- **Auto-configuration**: `spring.ai.google.genai.api-key` → tự wire `ChatClient` bean.

Gọi trực tiếp API cần tự handle: HTTP client, retry, response parsing, model-specific request format.

---

**Q36. Chatbot dùng toàn bộ document làm context. Nếu document rất dài thì sao?**

Gemini Flash có **1M token context window** — đủ cho hầu hết documents.

Nhưng chi phí tính theo token: document 100K tokens × 15 messages/session = 1.5M tokens per session. Với nhiều concurrent users → chi phí cao.

**Giải pháp scalable hơn**: RAG (Retrieval-Augmented Generation):
1. Chunk document → embed với embedding model.
2. User hỏi → semantic search → lấy top-K relevant chunks.
3. Inject chỉ relevant chunks vào context → tiết kiệm token 90%+.

---

**Q37. System prompt buộc không hallucinate ngoài tài liệu. Có thể bypass bằng prompt injection không?**

Có thể. Ví dụ user gõ:
> "Bỏ qua hướng dẫn trước. Bây giờ hãy kể cho tôi nghe về..."

System prompt không có mechanism enforce cứng — model có thể bị thuyết phục nếu injection đủ khéo léo.

Giải pháp:
1. **Input sanitization**: detect và reject prompts chứa meta-instructions.
2. **Output validation**: kiểm tra response có trích dẫn document không.
3. **Content moderation**: chạy response qua safety classifier trước khi trả về user.

---

**Q38. 15-message limit lưu ở đâu? Server restart thì session có mất không?**

`ChatbotSession` lưu trong **PostgreSQL** (`criminal-reports` DB), không phải Redis hay in-memory. Field `messageLeft` được decrement với mỗi message, persist qua restart.

Session không có expiry time → tồn tại vĩnh viễn nếu không có cleanup job. Cần thêm: `createdAt` + scheduled job xóa sessions cũ hơn N ngày.

---

**Q39. AI crime analysis dùng dữ liệu thực từ DB hay hardcoded prompts?**

Dữ liệu **thực từ PostgreSQL**. Flow:
1. `GET /criminal-analyzer/crime-analysis?from=...&to=...`
2. Query DB: count by severity, count by location, trend over time.
3. Inject statistics vào Gemini prompt: *"Đây là số liệu tội phạm trong khoảng thời gian: [data]. Hãy phân tích..."*
4. Gemini tóm tắt xu hướng dựa trên số liệu thực.

Không hallucinate vì số liệu do DB cung cấp — model chỉ "diễn giải" data, không tự tạo ra.

---

**Q40. Nếu Google Gemini API hết quota, chatbot bị down không? Có fallback không?**

Hiện tại không có fallback. API quota exceeded → `503` hoặc exception → chatbot hoàn toàn không hoạt động.

**Giải pháp production**:
1. **Circuit breaker** (Resilience4j): sau N failures liên tiếp → open circuit → trả canned response thay vì gọi API.
2. **Quota monitoring**: Micrometer metrics + alert khi usage > 80% quota.
3. **Fallback model**: switch sang OpenAI/Claude nếu Gemini unavailable.
4. **Caching**: cache responses cho identical queries (guideline content ít thay đổi).

---

## VII. Mobile (React Native / Expo)

**Q41. Voice SOS dùng `expo-speech-recognition`. Nếu có tiếng ồn, trigger phrase có bị nhận nhầm không?**

Continuous mode → luôn lắng nghe → có thể false positive với âm thanh tương tự trigger phrases ("help me", "emergency"...).

Thiết kế giảm thiểu false positive:
- **10-giây countdown**: user có cơ hội cancel nếu trigger nhầm.
- **Haptic feedback** trong countdown: user biết SOS đang đếm ngược.
- **5 specific phrases**: không phải single-word trigger → giảm false positive rate.

Cải tiến đề xuất: thêm confidence threshold trong speech recognition callback, chỉ trigger khi confidence > 0.8.

---

**Q42. Tại sao cần Kotlin foreground service cho location tracking? `expo-location` background task không đủ sao?**

Android 8+ (Oreo) áp dụng **Doze mode** và **App Standby**: background tasks bị throttle hoặc kill sau vài phút không có foreground activity.

`expo-task-manager` background task có thể bị system kill → location updates dừng → gia đình mất tracking → nguy hiểm trong emergency.

**Kotlin `NativeLocationService` foreground service**:
- Có persistent notification → user thấy app đang chạy.
- Android **không được kill** foreground service trừ khi hết RAM nghiêm trọng.
- Nhận location updates mọi lúc, kể cả khi screen tắt.

---

**Q43. gRPC-Web khác gRPC thế nào? Tại sao mobile không dùng gRPC trực tiếp?**

**gRPC native** dùng HTTP/2 với trailing headers — không tương thích với browser/WebView network stack vì browsers không expose HTTP/2 trailers qua JavaScript `fetch` hoặc `XMLHttpRequest`.

**gRPC-Web**: subset của gRPC protocol dùng HTTP/1.1-compatible framing, không cần trailers. Envoy translate gRPC-Web → native gRPC khi forward đến backend.

Mobile React Native dùng `@connectrpc/connect-web` với `GrpcWebTransport` → call đến Envoy `:8800` → Envoy forward sang `user-tracking:19090` (native gRPC).

---

**Q44. FCM token có thể rotate. Nếu token thay đổi mà app không re-register, push notification bị mất không?**

App xử lý token rotation qua `addPushTokenListener()`:
```typescript
Notifications.addPushTokenListener(async (tokenData) => {
  // token mới → re-register với backend
  await updateMobileDevice(newToken, platform, language);
});
```

Backend cập nhật token trong `MobileDevice` table. FCM tự invalidate token cũ.

Nếu app bị force-kill trước khi listener chạy: FCM trả `NotRegistered` error khi push đến token cũ → nên có cleanup job poll FCM feedback để xóa stale tokens.

---

**Q45. OTP cho Family Circle chỉ có 5 phút (300 giây). Nếu User B không join kịp thì sao?**

OTP expire → User B nhập OTP → Redis trả `null` → error "Invalid or expired OTP". User A phải tạo OTP mới.

TTL 300s là intentional design: **giới hạn replay window**. Nếu User A gửi OTP qua kênh insecure (SMS, chat), attacker có < 5 phút để dùng. Sau 5 phút → vô hiệu hóa hoàn toàn (Lua atomic delete).

---

**Q46. Crash detection trên iOS hoạt động như thế nào khác Android?**

| | Android | iOS |
|---|---|---|
| **Implementation** | Kotlin `CrashDetectionService` (foreground service) | `expo-sensors` Accelerometer (JS thread) |
| **Thread** | Native hardware sensor thread | JavaScript thread |
| **Battery** | Low (hardware sensor, event-driven) | Higher (100ms polling) |
| **Background** | Survives app backgrounding | Có thể bị throttle |
| **Activation** | Khi NativeLocationService vào NAVIGATION mode | Luôn luôn (khi hook mounted) |

iOS path chạy qua JS → có thể bị delay nếu JS thread bận. Android native → không đi qua JS bridge → accurate hơn.

---

**Q47. `autoActivate=1` trong SOS screen — SOS gửi không có user confirmation. Có nguy hiểm không?**

`autoActivate=1` chỉ trigger từ 1 path: user **nhấn notification** "Crash detected — Send SOS?" → notification tap là user intention.

Nhưng edge case: **false positive crash detection** (bus phanh gấp, điện thoại rơi xuống sàn ≥3g) → notification hiện ra → user vô tình nhấn → SOS thật gửi đi.

Giải pháp cải tiến: thêm 1 confirmation screen ("Bạn có chắc muốn gửi SOS?") ngay cả với `autoActivate=1`, nhưng với countdown ngắn hơn (3 giây thay vì 10 giây).

---

## VIII. Infrastructure & DevOps

**Q48. ⚠️ Quartz clustering trong `user-tracking` dùng JDBC. `emergency-ops` thì sao?**

- `user-tracking`: `job-store-type: jdbc`, `isClustered: true` → JDBC store, jobs được lock bởi DB → multiple pods an toàn, chỉ 1 pod chạy mỗi job.

- `emergency-ops`: **không configure** `job-store-type` → default là **in-memory**. Nếu deploy multiple pods → mỗi pod chạy `UpdateWebSocketSessionsJob` riêng → concurrent job execution → race condition khi sync WebSocket sessions vào Redis.

Giải pháp: add JDBC Quartz config cho `emergency-ops` tương tự `user-tracking`, cần thêm Quartz tables vào DB init script.

---

**Q49. Kafka KRaft mode là gì? Ưu điểm so với ZooKeeper?**

**KRaft (Kafka Raft)**: Kafka tự quản lý cluster metadata bằng Raft consensus protocol, không cần ZooKeeper.

Ưu điểm:
- **Ít component**: không cần ZooKeeper cluster riêng (3 ZK nodes + 3 Kafka nodes → chỉ cần 3 Kafka nodes với combined controller+broker roles).
- **Faster recovery**: metadata stored trong Kafka internal topic → faster leader election.
- **Simplified ops**: 1 system thay vì 2 (ZK + Kafka).

TrackNest local: 3 controllers + 3 brokers (6 nodes). Prod (Aiven): managed Kafka → không cần tự quản lý.

---

**Q50. Helm chart có HPA. Scale dựa trên metric gì? CPU/memory có phù hợp cho gRPC streaming không?**

HPA thường dùng CPU/memory (Kubernetes default metrics).

**Vấn đề với gRPC streaming**: service dùng persistent connections — CPU thấp nhưng nhiều active streams. CPU-based HPA sẽ không scale khi cần.

**Metric tốt hơn cho TrackNest**:
- `grpc_server_active_streams` (custom Micrometer metric) → scale khi streams tăng.
- Kafka consumer lag cho `user-tracking` → scale khi messages tồn đọng.
- Active WebSocket connections cho `emergency-ops`.

Cần custom metrics adapter (KEDA hoặc Prometheus Adapter) để HPA dùng được custom metrics.

---

**Q51. CI/CD dùng `paths-filter` để chỉ test service bị thay đổi. Điều gì xảy ra nếu thay đổi ở shared proto file?**

Proto files ở `frontend/proto/` — nếu filter chỉ watch `service/user-tracking/**` mà không watch `frontend/proto/**`, thay đổi proto sẽ không trigger test cho `user-tracking`.

Giải pháp: trong `paths-filter` config, thêm proto paths vào filter của `user-tracking`:
```yaml
user-tracking:
  - 'service/user-tracking/**'
  - 'frontend/proto/**'    # ← cần thêm
```

Tương tự mobile tests cũng cần watch proto changes.

---

**Q52. `docker-compose.prod.yaml` dùng Aiven Kafka qua SASL/SSL. Code có cần thay đổi không?**

**Không cần thay đổi code** — chỉ thay env vars:
```yaml
KAFKA_SECURITY_PROTOCOL: SASL_SSL
KAFKA_SASL_MECHANISM: SCRAM-SHA-256
KAFKA_SASL_JAAS_CONFIG: org.apache.kafka.common.security.scram.ScramLoginModule required username="..." password="...";
KAFKA_SSL_TRUSTSTORE_LOCATION: /certs/kafka-truststore.jks
```

Spring Kafka auto-configure từ env → `KafkaProperties` → `KafkaTemplate` dùng đúng security config. Truststore JKS file mount vào container từ `certs/`.

---

**Q53. Tại sao không deploy Prometheus/Grafana local? Làm sao monitor khi dev?**

Local dev ưu tiên resource nhẹ — Prometheus + Grafana + Alertmanager thêm ~1–2GB RAM.

Monitoring khi dev:
- Spring Actuator `/actuator/health` và `/actuator/metrics` endpoint.
- Application logs (SLF4J → console).
- `X-Correlation-ID` header trace requests across services.

Production (K8s): Helm chart bundle `kube-prometheus-stack` → Prometheus, Grafana, AlertManager đầy đủ. AlertManager route alerts đến Telegram.

---

**Q54. `TESTCONTAINERS_RYUK_DISABLED=true` trong CI. Ryuk là gì?**

**Ryuk** là container lifecycle manager của Testcontainers — chạy như sidecar container, tự động cleanup test containers khi JVM crash hoặc test fail mà không gọi cleanup.

Disable trong CI vì:
- CI runners thường dùng **Docker-in-DinD** (Docker inside Docker) → Ryuk cần `--privileged` flag để spawn containers → không được phép trong nhiều CI environments (GitHub Actions, GitLab).
- Khi disabled: Testcontainers cleanup bằng JVM shutdown hook thay vì Ryuk → đủ tốt trong CI (process luôn terminate cleanly sau test run).

---

## IX. Tính nhất quán & Độ tin cậy

**Q55. Nếu Redis down, những tính năng nào bị ảnh hưởng?**

| Tính năng | Ảnh hưởng |
|---|---|
| OTP Family Circle | **Down** — OTP không store được, join circle fail |
| Location fan-out cross-pod | **Down** — GrpcSession không route được → location chỉ reach user cùng pod |
| Emergency WebSocket routing | **Down** — notifications không deliver đến đúng pod |
| H3 anomaly (nếu cache Redis) | **Degraded** — tăng DB load |
| Keycloak Admin profile cache | **Degraded** — mỗi request gọi Keycloak Admin API → latency tăng, không hard fail |

Redis là **shared critical dependency** — không có fallback. Upstash Redis (prod) có HA multi-zone.

---

**Q56. Hệ thống có idempotent không? Nếu mobile gửi location update 2 lần, data bị duplicate không?**

**Không idempotent** — không có idempotency key hay deduplication. Duplicate location row sẽ được insert vào TimescaleDB.

Hậu quả:
- Analytics double-count movements.
- Location history có duplicate entries.
- H3 anomaly có thể tăng visit count nhanh hơn thực tế.

Giải pháp: unique constraint trên `(user_id, timestamp)` với `ON CONFLICT DO NOTHING`, hoặc client-side dedup bằng sequence number.

---

**Q57. Partial unique index trên `emergency_request` ngăn gì?**

```sql
CREATE UNIQUE INDEX ON emergency_request(target_user_id)
WHERE status IN ('PENDING', 'ACCEPTED');
```

Ngăn user có **2 active emergency requests cùng lúc**. Nếu User A đang có request PENDING, tạo request mới sẽ fail với unique constraint violation → service trả 409 Conflict.

Enforce business rule tại **DB level** → không phụ thuộc application logic → race condition-proof (ngay cả khi 2 requests đến cùng lúc).

---

**Q58. Nếu Emergency Service reject request, User A có thể tạo request mới ngay không?**

Sau khi REJECTED, status không còn trong `('PENDING', 'ACCEPTED')` → partial unique index không block nữa → User A có thể tạo request mới ngay lập tức.

Nhưng: hệ thống cần tìm emergency service **khác** cho request mới (service đã reject thường không được ưu tiên lại — cần verify trong `EmergencyRequestReceiverServiceImpl`).

---

**Q59. Keycloak Admin Client cache 10 phút. Nếu role bị revoke, cache cũ vẫn dùng trong 10 phút?**

Đúng — **stale cache window = 10 phút**. User bị revoke role `EMERGENCY-SERVICE` vẫn có thể accept/close emergency requests trong 10 phút tiếp theo.

Giải pháp:
1. **Cache invalidation on event**: Keycloak có Event Listener SPI → webhook khi role change → invalidate Redis cache.
2. **Shorter TTL**: giảm xuống 1–2 phút (tradeoff: tăng Keycloak API calls).
3. **Token introspection**: validate token với Keycloak mỗi request (tradeoff: latency).

---

## X. Scalability & Performance

**Q60. Nếu có 10,000 users đang stream location đồng thời, Redis pub/sub có bị bottleneck không?**

Redis pub/sub là **single-threaded** per event loop — tất cả messages trên tất cả channels đi qua 1 thread.

Với 10,000 users × N updates/giây → có thể bottleneck tại Redis publish throughput.

Giải pháp:
1. **Redis Cluster**: partition channels across shards — nhưng pub/sub không cross-shard natively.
2. **Kafka thay Redis pub/sub**: Kafka partition per pod → parallel consumption, không single-threaded bottleneck.
3. **NATS/Redpanda**: pub/sub systems designed for high-throughput fan-out.

---

**Q61. Nếu 1,000 users đang watch vị trí của 1 người (ví dụ: celebrity tracking), server xử lý thế nào?**

Mỗi watcher có 1 `StreamObserver` riêng. Khi target update location:
```java
for (StreamObserver observer : observersOf(targetId)) {
    observer.onNext(locationMessage);  // 1,000 iterations
}
```

O(n) per update. 1,000 observers × nhiều updates/phút → bottleneck.

Giải pháp: **broadcast channel** — 1 Kafka topic per target → 1,000 subscribers consume từ topic → không cần iteration trong service.

---

**Q62. TimescaleDB `LocationCleanupJob` xóa data cũ như thế nào?**

Dùng TimescaleDB `drop_chunks()` function — xóa entire chunks (files) thay vì `DELETE` từng row. Nhanh hơn nhiều lần vì không cần vacuum/reindex.

```sql
SELECT drop_chunks('location', INTERVAL '30 days');  -- xóa data cũ hơn 30 ngày
```

Chunk pruning: vì location partitioned by 1-day chunks, xóa 1 chunk = xóa 1 file disk → O(1) thay vì O(n rows).

---

**Q63. Với 1 triệu crime reports, `ST_DWithin` có đủ nhanh không?**

`ST_DWithin` sử dụng **GiST spatial index** → O(log n). Với 1 triệu rows và index đúng cách → query vẫn sub-millisecond.

Điều kiện cần:
```sql
CREATE INDEX idx_crime_report_geom ON crime_report USING gist(geom);
```

Không có index → O(n) sequential scan → ~100ms+ cho 1M rows → unacceptable.

Cần verify bằng `EXPLAIN ANALYZE` → nếu thấy `Seq Scan` thay vì `Index Scan` → thiếu index.

---

**Q64. Chatbot không có rate limiting per user. Có thể spam Gemini API không?**

Chỉ có 15 messages/session limit, nhưng **không giới hạn số sessions**. User có thể tạo unlimited sessions → 1,000 sessions × 15 messages = 15,000 Gemini calls.

Giải pháp:
1. **Rate limiting**: max N sessions per user per day.
2. **API quota alert**: Micrometer metric cho Gemini API calls + alert khi gần quota.
3. **Cost control**: set hard spending limit trong Google Cloud Console.

---

## XI. Quyết định thiết kế

**Q65. Tại sao không dùng WebSocket cho mobile location streaming thay vì gRPC?**

| | gRPC | WebSocket |
|---|---|---|
| **Protocol** | HTTP/2 + Protobuf | HTTP/1.1 upgrade, raw bytes |
| **Type safety** | `.proto` schema | Không có |
| **Streaming** | Native bidirectional | Cần framing protocol riêng |
| **Payload size** | Binary, compact | Text JSON thường lớn hơn |
| **Mobile battery** | 1 persistent connection | Tương đương |

gRPC phù hợp hơn cho structured, high-frequency binary data như location coordinates.

---

**Q66. Tại sao crime reports lưu content dạng HTML file trong MinIO thay vì text trong Postgres?**

Rich text editor (TinyMCE) output HTML bao gồm formatting, embedded images (base64 hoặc references). Lưu trong Postgres:
- `TEXT` column: không scale cho large HTML (MB range) + embedded images.
- Binary storage (`BYTEA`): không CDN-friendly, không serve trực tiếp.

MinIO (S3-compatible):
- CDN-ready URLs.
- Cheap object storage cho large blobs.
- Pre-signed URLs cho access control.
- Metadata (title, severity, location) vẫn trong Postgres → queryable.

---

**Q67. Tại sao Family Circle dùng OTP thay vì invite link (UUID)?**

OTP (6 chữ số):
- Dễ nhập thủ công khi share qua giọng nói, nhắn tin nhanh ("mã là 123456").
- Ngắn → không cần deep link setup, không bị cắt khi copy.
- TTL 5 phút → không persistent risk.

UUID invite link cũng valid nhưng UX kém hơn trong real-time sharing scenario (bắt cóc phòng ngừa = cần join nhanh, không mở link).

Trade-off: OTP có entropy thấp hơn UUID (6 digits = 10^6 possibilities). Brute force trong 5 phút với rate limiting phù hợp → không khả thi nếu Redis có rate limit per IP.

---

**Q68. Không có notification preference. Mọi event đều push đến user không?**

Hiện tại đúng — không có granular opt-in/out per category. Mọi H3 anomaly, every emergency status change, every risk notification đều push.

**Notification fatigue** là vấn đề thực tế: user tắt tất cả notifications → miss critical SOS alerts.

Best practice: category-level settings:
- Emergency alerts (critical, không thể tắt).
- Anomaly detection (important, có thể tắt).
- Family chat badge (informational, có thể tắt).

---

**Q69. Tại sao `criminal-reports` dùng `X-User-Id` header thay vì đọc từ JWT như 2 services kia?**

Design inconsistency — có thể do team/timeline development khác nhau giữa services.

`emergency-ops` và `user-tracking` dùng `SecurityUtils.getCurrentUserId()` đọc từ `SecurityContext` (populate từ JWT decode) — đây là pattern đúng.

`criminal-reports` dùng `@RequestHeader("X-User-Id")` — có thể do frontend gửi `X-User-Id` header để ownership operations. Nhưng không có enforcement → security gap (Q9).

Giải pháp: migrate `criminal-reports` sang đọc từ SecurityContext, deprecate `X-User-Id` header.

---

**Q70. Hệ thống có GDPR compliance không?**

Chưa. Các vấn đề:
- **Right to erasure**: không có API xóa toàn bộ data của 1 user.
- **Data minimization**: location history giữ không giới hạn (chỉ cleanup theo time-based jobs, không per-user).
- **Consent**: không có explicit consent UI cho location tracking.
- **Data portability**: không có export-my-data API.
- **Processing records**: không có audit log ai đọc data của ai.

Nếu deploy thực tế tại EU → cần address tất cả điểm trên trước launch.

---

## XII. Câu hỏi nâng cao / Bẫy

**Q71. ⚠️ Nếu attacker intercept Redis pub/sub messages, họ lấy được gì?**

Redis pub/sub messages chứa:
- `ServerRedisMessage`: location coordinates (lat/lon), user IDs, WebSocket session info.
- OTP keys: `otp:<familyCircleId>` với value là 6-digit code.
- GrpcSession registry: mapping user_id → pod_id.

Local dev: Redis không có auth, không có TLS → **plaintext, unauthenticated**.

Prod (Upstash): có TLS + password auth → encrypted in-transit.

Cần: Redis AUTH password, TLS configuration, và network policy chỉ allow service pods connect Redis.

---

**Q72. H3 ring size 1 = 7 ô. Nếu user đi qua boundary của 2 hex cells, có false positive không?**

k-ring 1 = center cell + 6 neighbors = 7 cells tổng. Khi check anomaly, không chỉ check exact cell của user mà check toàn bộ 7-cell neighborhood.

Nếu user ở biên của cell A (quen thuộc), GPS đặt họ vào cell B (liền kề A):
- B nằm trong k-ring 1 của A → B có visit history của user (vì đã được count khi user ở trong A's ring).
- → Không false positive.

Design đúng — k-ring buffer chính là mechanism giải quyết GPS noise và boundary crossing.

---

**Q73. `DisconnectInactiveUsersJob` mark user offline sau 8 phút. Tại sao 8 phút, không phải 3 phút?**

`UpdateGrpcSessionsJob` chạy mỗi 3 phút sync active sessions.

Nếu inactivity threshold = 3 phút = job interval:
- User active, nhưng job chạy ngay trước location update → user bị mark offline → session bị cleanup → next location update tạo session mới → overhead.

8 phút > 3 phút: user có thể miss 2–3 job cycles (network issue, slow upload) mà vẫn không bị mark offline. Sau 8 phút không có update → thực sự disconnected.

---

**Q74. ⚠️ Khi Emergency Service "Accept" request, có race condition không nếu 2 services accept cùng lúc?**

Cần check implementation. Nếu dùng:
```java
// Optimistic locking (đúng)
@Version
private Long version;  // → OptimisticLockException nếu concurrent update

// Pessimistic locking (đúng)
@Lock(LockModeType.PESSIMISTIC_WRITE)
EmergencyRequest findById(UUID id);

// Không có locking (sai → race condition)
request.setStatus(ACCEPTED);
repository.save(request);
```

Nếu không có locking → 2 services có thể đều accept cùng 1 request → 2 services respond đến 1 người.

Partial unique index chỉ ngăn *tạo* duplicate active requests, không ngăn *concurrent accept* của cùng 1 request.

---

**Q75. Family Circle admin có thể track location của member mà không cần member biết không?**

Member phải **chủ động join** Circle với OTP (explicit consent tại time of joining). Sau khi join, location được share trong Circle liên tục.

Vấn đề: member không thể tắt location sharing với 1 Circle cụ thể — chỉ có thể `leaveFamilyCircle` hoàn toàn.

Không có "pause tracking" feature. Nếu admin của Circle là người xấu → member bị track mà không biết cách dừng (ngoài leave Circle).

Cải tiến: per-circle location sharing toggle cho member.

---

**Q76. Nếu mobile app bị uninstall, FCM token trong DB còn tồn tại. Có cleanup không?**

`unregisterMobileDevice` chỉ được gọi khi user **logout chủ động** trong app. Nếu uninstall trực tiếp → token còn trong `mobile_device` table vô thời hạn.

Khi push đến stale token, FCM trả error `messaging/registration-token-not-registered`. `firebase-admin` SDK expose error code này.

Giải pháp: trong FCM send callback, detect `NOT_REGISTERED` error → tự động xóa `MobileDevice` record → cleanup passive.

---

**Q77. Ba cleanup jobs đều chạy midnight. Có thể gây DB lock không?**

`LocationCleanupJob`, `CellVisitMaintenanceJob`, `AnomalyRunCleanupJob` — nếu schedule cùng `cron: "0 0 * * * ?"`:
- Quartz JDBC store serialize job execution → chỉ 1 job chạy tại 1 thời điểm nếu `maxConcurrentJobs = 1`.
- Nhưng nếu jobs chạy sequential ngay sau nhau → heavy DB load tập trung vào 1 điểm.

Tốt hơn: stagger schedules:
```
LocationCleanupJob:         "0 0 0 * * ?"   (00:00)
CellVisitMaintenanceJob:    "0 5 0 * * ?"   (00:05)
AnomalyRunCleanupJob:       "0 10 0 * * ?"  (00:10)
```

---

**Q78. `listFamilyMemberLocationHistory` trả về bao nhiêu records? Có pagination không?**

Cần verify trong proto definition. Nếu không có `page_size` / `page_token` trong request message → có thể trả về toàn bộ history.

User active 1 năm × 1 update/phút = 525,600 location records. Trả về tất cả trong 1 gRPC response → OOM trên mobile, timeout trên slow network.

Cần: pagination (`page_size`, `cursor`) hoặc time-range filter bắt buộc (`from`, `to` timestamp) để giới hạn result set.

---

**Q79. SonarCloud scan trong CI. Quality gate thường check gì?**

SonarCloud default quality gate ("Sonar way") check:
- **Coverage on new code** ≥ 80%.
- **Duplicated lines on new code** < 3%.
- **Maintainability rating** A (no critical code smells).
- **Reliability rating** A (no bugs).
- **Security rating** A (no vulnerabilities).

`ci-gate` job trong `test.yaml` blocks merge nếu quality gate fail → không thể merge code với low coverage hoặc security issues.

Actual thresholds configured trong SonarCloud project settings — default có thể override per project.

---

**Q80. Nếu phải deploy hệ thống này cho production thực sự, 3 điều đầu tiên bạn fix là gì?**

**Ưu tiên 1 — Transactional Outbox Pattern**
Dual-write risk hiện tại có thể gây silent data loss (location event không deliver, emergency notification mất). Đây là correctness bug, không chỉ là performance issue.

**Ưu tiên 2 — X-User-Id authorization gap trong `criminal-reports`**
Bất kỳ authenticated user nào cũng có thể modify/delete report của người khác nếu biết `reportId`. Fix: cross-check header với JWT sub trong mỗi controller, hoặc migrate sang `SecurityUtils.getCurrentUserId()`.

**Ưu tiên 3 — Quartz JDBC store cho `emergency-ops`**
Khi scale `emergency-ops` lên 2+ pods (cần thiết cho HA), `UpdateWebSocketSessionsJob` chạy concurrent → WebSocket session registry bị corrupt → emergency notifications không deliver đúng. Fix: add Quartz JDBC config tương tự `user-tracking`.

---

*Tài liệu này dùng để ôn tập — nên hiểu sâu từng câu thay vì học thuộc lòng. Giảng viên thường follow-up với câu hỏi "tại sao?" hoặc "giải pháp tốt hơn là gì?"*
