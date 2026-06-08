# WebSocket / RxJS Notification — Báo cáo vấn đề & giải pháp

> Phạm vi: `frontend/track-nest-web` (STOMP + RxJS) ↔ `service/emergency-ops` (Spring WebSocket).
> Báo cáo này liệt kê các vấn đề đã xác định trong đường dẫn realtime notification và đề xuất hướng sửa cụ thể.

## Trạng thái áp dụng (cập nhật mới nhất)

| # | Vấn đề | Trạng thái | Ghi chú |
|---|--------|-----------|---------|
| P1 | Stale JWT closure trong EmergencyRequestRealtimeContext | ✅ Fixed | Context không capture token; `emergencyOpsStomp` tự fetch fresh JWT mỗi handshake |
| P2 | Stale JWT closure trong ReportRealtimeContext | ✅ Fixed | Chuyển sang `criminalReportsStomp` singleton, dùng cùng cơ chế |
| P3 | Strict Mode duplicate Client | ✅ Fixed | Cả 2 context giờ cùng singleton; subscribe queue + idempotent connect |
| P4 | Không reconnect khi JWT refresh | ✅ Fixed | `authService.token$` BehaviorSubject; 2 context subscribe → gọi `stompService.reconnect()` |
| P5 | Backend bỏ qua null principal | ✅ Fixed | `RedisHandshakeInterceptor` reject 401 + log cảnh báo |
| P6 | Không buffer message khi user offline | ✅ Fixed | Bảng `pending_notification` + `NotificationOutboxService` + flush trong `StompSessionConnectedListener` **theo `SessionSubscribeEvent`** (xem ghi chú "Race fix" bên dưới). Áp dụng cho assignment/status, **không** áp dụng cho location stream. |
| P7 | Race CONNECTED ↔ SUBSCRIBE | ✅ Fixed | `subscribe` queue vào `subs` map; flush trong `onConnect` |
| P8 | Topic `/topic/reports/*` không có publisher | ✅ Fixed | `ReportEventPublisher` ở `criminal-reports` + wire vào `ReportManagerServiceImpl`, `CrimeReportRequestReceiverServiceImpl`, `MissingPersonRequestReceiverServiceImpl`, `ReportAdminServiceImpl` |
| P9 | RxJS plan dở dang | ◻️ Out of scope | Tách riêng — xem `RXJS_ROLE_AND_MIGRATION.md` |

---

## 1. Tổng quan luồng hiện tại

```
[Next.js client]
  EmergencyRequestRealtimeContext ─┐
  ReportRealtimeContext            ├─► SockJS(?access_token=JWT) ─► Envoy ─► emergency-ops:/ws
  NotificationContext (in-memory)  ─┘                                         │
                                                                              ▼
                                                       KeycloakFilter (decode JWT, set Principal)
                                                                              │
                                                                              ▼
                                                       RedisHandshakeInterceptor (register session)
                                                                              │
                                                                              ▼
                                                       SimpleBroker /queue, /topic, /user
```

Provider order (load-bearing):
`LocaleProvider → AuthProvider → NotificationProvider → EmergencyRequestRealtimeProvider → ReportRealtimeProvider`

Destinations đang dùng:
- `/user/queue/emergency-request` — Emergency Service nhận assignment
- `/user/queue/user-location` — Emergency Service nhận stream vị trí
- `/user/queue/emergency-request-status` — Reporter nhận update trạng thái
- `/topic/reports/{crime|missing-person|guideline}` — broadcast report updates

---

## 2. Các vấn đề đã xác định

### 🔴 P1 — Stale JWT bị "đóng băng" trong closure (CRITICAL)

**File:** `contexts/EmergencyRequestRealtimeContext.tsx:62`
```ts
const token = authService.getAccessToken();   // ← chụp 1 lần khi effect chạy
if (!token) return;
const connect$ = defer(() => from(stompService.connect(token))); // ← token trong closure
```

`defer()` chỉ lười về *thời điểm gọi*, không lười về *giá trị*. Khi Keycloak `onTokenExpired` refresh JWT (xem `services/authService.ts:170-178`), biến `token` ở trên vẫn là token cũ — bất kỳ reconnect nào do `defer` kích hoạt đều dùng JWT đã hết hạn.

**Hệ quả:** Sau ~30 phút idle, kết nối WS hoặc handshake mới sẽ thất bại / không có principal, mọi notification rớt im lặng.

### 🔴 P2 — Lặp lại lỗi stale token ở `ReportRealtimeContext` (CRITICAL)

**File:** `contexts/ReportRealtimeContext.tsx:67-75`
```ts
const token = authService.getAccessToken();
if (!token) return;
const client = new Client({
  webSocketFactory: () =>
    new SockJS(`${wsUrl}?access_token=${encodeURIComponent(token)}`), // ← token cứng trong URL
  reconnectDelay: 5000,
});
```

Khi `reconnectDelay` kích hoạt sau khi token expired, SockJS sẽ retry với URL chứa JWT cũ → backend reject → loop reconnect vô ích.

### 🔴 P3 — Tạo nhiều STOMP Client trong React Strict Mode (CRITICAL)

**File:** `contexts/ReportRealtimeContext.tsx:64-103`

`useEffect` tạo mới `new Client({...})` rồi `client.activate()` mỗi lần effect chạy. Trong dev (Strict Mode) effect chạy 2 lần → có thời điểm tồn tại **hai client song song** trước khi cleanup chạy. Khác với `EmergencyRequestRealtimeContext` dùng `stompService` singleton, context này không có hàng rào singleton nào.

**Hệ quả:** trùng kết nối, có thể nhận message 2 lần, hoặc backend đăng ký 2 session cho cùng user dẫn đến routing sai.

### 🟠 P4 — Không reconnect khi JWT được refresh (HIGH)

**Files:** `services/stompService.ts`, `services/authService.ts:170-178`

`authService.onTokenExpired` chỉ gọi `keycloak.updateToken(30)` rồi `persistKeycloakAuth()`. Không có cơ chế nào báo cho các provider STOMP để reconnect với token mới. Kết nối hiện tại tiếp tục sống nhưng các SUBSCRIBE mới sẽ bị broker từ chối khi JWT cũ hết hạn ở phía Spring Security.

### 🟠 P5 — Backend bỏ qua principal nếu JWT lỗi tại handshake (HIGH)

**Files:**
- `service/emergency-ops/.../security/KeycloakFilter.java:158-161`
- `service/emergency-ops/.../websocket/RedisHandshakeInterceptor.java:33-45`

```java
// KeycloakFilter
if (node.get("sub") == null) {
    log.warn("Authorization header token is missing subject");
    return null;          // không set principal
}

// RedisHandshakeInterceptor
Principal principal = request.getPrincipal();
if (principal != null) { /* register session */ }
return true;              // luôn cho qua dù principal == null
```

Handshake vẫn thành công nên client tưởng đã kết nối. Nhưng vì không có principal, `convertAndSendToUser(...)` về sau không tìm thấy user → drop im lặng.

### 🟠 P6 — Backend không buffer message cho user offline (HIGH)

**File:** `service/emergency-ops/.../emergencyrequestreceiver/impl/EmergencyRequestReceiverServiceImpl.java:147-150`

```java
messagingTemplate.convertAndSendToUser(
        receiverId.toString(), emergencyRequestQueue, message);
```

`SimpleBroker` không persist. Nếu Emergency Service đang offline tại khoảnh khắc Redis fan-out đến, assignment biến mất. Không có DLQ, không có resend khi user reconnect.

### 🟡 P7 — Race condition giữa CONNECTED frame và SUBSCRIBE (MEDIUM)

**Files:** `contexts/EmergencyRequestRealtimeContext.tsx:71-98`, `lib/rxjs-helpers.ts`, `services/stompService.ts:47-54`

```ts
subscribe(destination, callback) {
  if (!client?.connected) return null;   // ← trả null nếu kiểm tra trượt micro-task
  return client.subscribe(destination, callback);
}
```

`fromStompChannel` gọi `stompService.subscribe(...)` ngay sau khi promise `connect()` resolve. Nếu vì lý do scheduling mà `client.connected` chưa true tại lần check đầu, hàm trả `null` → observable không bao giờ phát.

### 🟡 P8 — Frontend subscribe `/topic/reports/*` nhưng không tìm thấy publisher backend (MEDIUM)

**File frontend:** `contexts/ReportRealtimeContext.tsx:34-38`

```ts
const TOPIC_MAP = {
  crime:         "/topic/reports/crime",
  missingPerson: "/topic/reports/missing-person",
  guideline:     "/topic/reports/guideline",
};
```

Tìm trong `emergency-ops` không có nơi nào `convertAndSend(...)` vào các topic này. Theo CLAUDE.md, dữ liệu report nằm ở `criminal-reports`, nhưng service đó không thấy đăng ký endpoint STOMP. Frontend chờ message từ một publisher không tồn tại.

### 🟢 P9 — RxJS migration plan chỉ thực hiện một phần (LOW)

**File:** `RXJS_INTEGRATION_PLAN.md`

Phase 1 (helpers), Phase 5 (authService `shareReplay(1)`), Phase 6 (NotificationContext Subject + scan) đã làm. Phase 2 (Emergency context) còn dùng pattern hỗn hợp; Phase 3 (search debounce), Phase 4 (ChatbotPanel), Phase 7 (cleanup) chưa làm → không đồng nhất.

---

## 3. Gợi ý giải pháp

### Giải pháp cho stale token (P1, P2, P4)

Thay vì capture token một lần, để mỗi lần kết nối lấy lại token mới nhất + đảm bảo nó còn hiệu lực:

```ts
// services/authService.ts
async getFreshAccessToken(): Promise<string | null> {
  await keycloak.updateToken(30);   // refresh nếu còn dưới 30s
  return keycloak.token ?? null;
}

// có thể expose Observable<string> để emit token mới sau mỗi lần refresh
token$ = new BehaviorSubject<string | null>(initialToken);
```

Trong context:

```ts
const connect$ = defer(() => from(authService.getFreshAccessToken())).pipe(
  filter((t): t is string => !!t),
  switchMap((token) => from(stompService.connect(token))),
);
```

Và đăng ký reconnect khi token được refresh:

```ts
useEffect(() => {
  const sub = authService.token$
    .pipe(distinctUntilChanged(), skip(1))   // bỏ qua lần phát đầu
    .subscribe(() => stompService.reconnect());
  return () => sub.unsubscribe();
}, []);
```

`stompService` cần thêm `reconnect(token)` để `deactivate()` → `activate()` lại với token mới.

### Giải pháp cho Strict Mode duplicate (P3)

Refactor `ReportRealtimeContext` để dùng cùng singleton `stompService` pattern như `EmergencyRequestRealtimeContext`, hoặc bọc bằng module-level guard:

```ts
let activeClient: Client | null = null;

function connectReports(token: string) {
  if (activeClient?.active) return activeClient;
  activeClient = new Client({ /* ... */ });
  activeClient.activate();
  return activeClient;
}
```

Hoặc đơn giản hơn: gộp cả emergency và report channels vào cùng một `stompService` (cùng một endpoint), chỉ khác destination subscribe.

### Giải pháp cho principal null tại handshake (P5)

Sửa `RedisHandshakeInterceptor.beforeHandshake` để **reject** handshake khi principal null thay vì cho qua:

```java
if (principal == null) {
    response.setStatusCode(HttpStatus.UNAUTHORIZED);
    return false;
}
```

Đồng thời, cân nhắc log rõ hơn ở `KeycloakFilter` để dễ debug (lý do null: expired, missing sub, malformed…).

Bổ sung phía client: bắt event `onWebSocketClose` với code 1008/4001 và force refresh token + reconnect.

### Giải pháp cho race condition subscribe (P7)

Trong `stompService.subscribe`, nếu chưa connected, queue lại đến khi `onConnect`:

```ts
const pending: Array<() => void> = [];
client.onConnect = () => {
  pending.splice(0).forEach((fn) => fn());
};

subscribe(destination, cb): Promise<StompSubscription> {
  if (client?.connected) return Promise.resolve(client.subscribe(destination, cb));
  return new Promise((resolve) => {
    pending.push(() => resolve(client!.subscribe(destination, cb)));
  });
}
```

Hoặc dùng `defer + retryWhen` để tự retry subscribe khi client chưa sẵn sàng.

### Giải pháp cho lost messages khi offline (P6)

Phương án 1 (đơn giản): khi user reconnect, frontend gọi REST endpoint "pending notifications" để pull các message đã miss.

Phương án 2 (đầy đủ): backend lưu notification vào bảng `notification_outbox` (status: PENDING/DELIVERED), `messagingTemplate.convertAndSendToUser` bọc trong cơ chế xác nhận; nếu không xác nhận trong N giây → giữ PENDING. Khi `RedisHandshakeInterceptor` đăng ký session, trigger flush các PENDING của user đó.

Phương án 3: thay `SimpleBroker` bằng full broker (RabbitMQ STOMP / ActiveMQ) hỗ trợ durable user queues — thay đổi lớn.

### Giải pháp cho topic không có publisher (P8)

Cần xác minh:
1. Có thực sự cần realtime cho crime / missing-person / guideline không? Nếu chỉ refresh list khi user quay lại tab thì xoá `ReportRealtimeContext` luôn.
2. Nếu cần: trong `criminal-reports` service, thêm WebSocket config tương tự `emergency-ops`, publish lên `/topic/reports/...` mỗi khi có bản ghi mới (qua Kafka listener hoặc trực tiếp trong service layer). Cập nhật env `NEXT_PUBLIC_CRIMINAL_REPORTS_WS_URL` cho khớp route Envoy.

### Hoàn thiện RxJS plan (P9)

Triển khai theo thứ tự gợi ý:
1. Hoàn thiện Phase 2: chuyển toàn bộ EmergencyRequestRealtimeContext sang RxJS streams thuần (kết hợp với fix P1/P4).
2. Đồng bộ ReportRealtimeContext với cùng pattern → giải quyết P2/P3.
3. Expose `authService.token$` (BehaviorSubject) để các context combineLatest với connection state.
4. Bỏ các guard thủ công (`if (!client?.connected)`) sau khi áp dụng queue ở P7.

---

## 4. Thứ tự ưu tiên triển khai đề xuất

| Bước | Việc | Lý do |
|------|------|-------|
| 1 | P5 (backend reject khi principal null) | Cho phép phát hiện lỗi sớm thay vì drop im lặng |
| 2 | P1 + P2 + P4 (token lifecycle phía client) | Khắc phục nguyên nhân chính khiến notification không tới |
| 3 | P3 (singleton STOMP client) | Tránh duplicate connection trong Strict Mode/dev |
| 4 | P7 (subscribe queue) | Loại bỏ race condition còn sót lại |
| 5 | P6 (outbox/pull on reconnect) | Đảm bảo at-least-once delivery |
| 6 | P8 (xác minh + sửa publisher reports) | Đóng các topic mồ côi |
| 7 | P9 (hoàn thiện RxJS plan) | Đồng nhất codebase |

---

## 5. Cách reproduce nhanh các vấn đề

- **P1/P4:** Đăng nhập Emergency Service, để tab idle ≥ 30 phút (vượt qua `tokenExp`), sau đó tạo emergency request từ tab khác → notification không hiện.
- **P3:** Mở DevTools → Network → WS, vào trang `/dashboard/crime-reports` ở dev mode, sẽ thấy 2 SockJS handshake gần như đồng thời.
- **P5:** Sửa tay `access_token` trong query string thành một JWT đã expired → vẫn thấy handshake 101 Switching Protocols nhưng không subscribe nào hoạt động.
- **P6:** Đăng nhập 2 tài khoản, tài khoản Emergency Service tắt mạng vài giây → trong khoảng đó tạo emergency request → bật mạng lại → assignment không xuất hiện cho đến khi reload.
- **P8:** Bật log STOMP frame ở client (`debug` callback), tạo crime report mới — không có FRAME `MESSAGE` nào tới destination `/topic/reports/crime`.

---

## 6. Ghi chú sau review

### Race fix cho P6 (đã sửa)
Phiên bản đầu tiên dùng `SessionConnectedEvent` để trigger flush, nhưng event này fire **trước** khi client kịp gửi `SUBSCRIBE` (round-trip mạng ~50–100ms). `SimpleBroker` không buffer → message replay rơi vào khoảng trống và bị drop. Đã đổi sang `SessionSubscribeEvent` + lọc theo destination → flush chỉ chạy sau khi sub đã register đúng, route OK.

### Vấn đề còn lại — không khắc phục đợt này

| # | Loại | Mô tả | Cách xử lý đề xuất |
|---|------|-------|--------------------|
| R1 | MEDIUM | Multi-tab duplicate delivery: 2 tab subscribe cùng destination → 2 listener gọi `flushFor` đồng thời → cả 2 đọc cùng PENDING rows → user nhận message 2 lần | Thêm `@Version` vào `PendingNotification` cho optimistic lock, hoặc dùng `SELECT FOR UPDATE SKIP LOCKED` trong query |
| R2 | LOW | `concurrent reconnect()` có thể để promise dangling (lần 1 chưa resolve thì lần 2 null hoá `connectPromise`) | Thực tế không xảy ra: chỉ 1 nguồn trigger (`token$` với `distinctUntilChanged`). Để ngỏ. |
| R3 | LOW | Sau logout không reload, singleton `emergencyOpsStomp.client` vẫn alive | Keycloak logout luôn redirect → page unload → moot. Có thể bổ sung `disconnect()` trong `authService.logout` để chắc chắn. |
| R4 | LOW | `criminalReportsStomp` không có handshake auth ở backend; `/topic/reports/*` broadcast cho mọi client kể cả unauth | Hiện chấp nhận (broadcast public). Copy `RedisHandshakeInterceptor` từ `emergency-ops` nếu sau này cần ACL. |
| R5 | PRE-EXISTING | Dual-write: `save → broadcast → commit` — commit fail sau khi broadcast → frontend nhận event mà DB rollback | Project-wide issue (CLAUDE.md ghi nhận). Cần outbox pattern cho mọi publisher, không riêng notification. |
| R6 | OPS | Outbox không có cleanup tự động — `delivered_at` rows tích lũy | Quartz job xoá `WHERE delivered_at < now() - INTERVAL '7 days'`. Index `idx_pending_notification_delivered_at` đã sẵn. |
