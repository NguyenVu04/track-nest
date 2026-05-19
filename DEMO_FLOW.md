# TrackNest — Gợi ý luồng demo

## Chuẩn bị trước demo

### Tài khoản cần có sẵn
| Vai trò | Realm | Dùng cho |
|---|---|---|
| User A (nạn nhân) | `public-dev` | Mobile app, gửi SOS |
| User B (thành viên gia đình) | `public-dev` | Mobile app thứ 2, xem vị trí |
| Reporter | `restricted-dev` | Web dashboard, tạo báo cáo |
| Emergency Service | `restricted-dev` | Web dashboard, nhận SOS |
| Admin | `restricted-dev` | Web dashboard, xem toàn bộ |

### Stack cần chạy
```bash
cd docker-compose
docker compose -f docker-compose.yaml up --build
```

### Thiết bị
- 2 điện thoại Android (hoặc 1 điện thoại + 1 emulator) cho User A và User B.
- 1 màn hình/tab web cho Emergency Service.
- 1 màn hình/tab web cho Reporter/Admin.

---

## Kịch bản demo đề xuất (45 phút)

### Phần 1 — Theo dõi vị trí gia đình (10 phút)

**Mục tiêu**: Thể hiện real-time location sharing, gRPC streaming, multi-pod fan-out.

**Bước 1.1 — Tạo Family Circle (User A, mobile)**
1. Mở app với tài khoản User A.
2. Vào Settings → tạo Family Circle mới tên "Demo Family".
3. Nhấn "Invite" → hệ thống tạo OTP, lưu trong Redis với TTL ngắn.
4. **Điểm nhấn**: giải thích OTP được xóa ngay sau khi dùng (Lua atomic script) → không thể replay.

**Bước 1.2 — Tham gia Family Circle (User B, mobile)**
1. Mở app với tài khoản User B.
2. Vào "Join Circle" → nhập OTP vừa tạo.
3. Xác nhận cả hai đã thấy nhau trong Members list.

**Bước 1.3 — Xem real-time location**
1. Cả hai mở tab Map.
2. Di chuyển điện thoại A → điện thoại B thấy marker của A di chuyển trên map trong vài giây.
3. **Điểm nhấn kỹ thuật**: giải thích gRPC server-streaming → Kafka → Redis pub/sub fan-out (kể cả khi hai user ở hai pod khác nhau).

**Bước 1.4 — Family Chat**
1. User A gửi tin nhắn trong Family Chat.
2. User B nhận tức thì (badge + message stream).
3. **Điểm nhấn**: gRPC bidirectional streaming; cross-pod qua Redis pub/sub tương tự location.

---

### Phần 2 — Phát hiện hành vi bất thường (5 phút)

**Mục tiêu**: Thể hiện H3 anomaly detection và push notification.

> **Lưu ý**: Tính năng này cần ≥20 lần ghé thăm cho một bucket (dayOfWeek, hourOfDay). Seed data trong DB đã có 1 tuần lịch sử vị trí → anomaly có thể trigger nếu di chuyển đến khu vực mới hoàn toàn.

**Bước 2.1**
1. Giải thích trên slide/code: H3 resolution 8 (~460m²), k-ring 1 = 7 ô liền kề.
2. Mô tả flow: vị trí mới → tra cứu bucket → kiểm tra CellVisit mature → publish Kafka → FCM push.

**Bước 2.2 — Trigger anomaly (nếu môi trường cho phép)**
1. Dùng GPS mock hoặc di chuyển thực đến vị trí mới hoàn toàn.
2. Sau vài location updates, điện thoại nhận push notification "Unusual movement detected".
3. Mở tab Notifications trong app → thấy `TrackingNotification` mới.

---

### Phần 3 — SOS và Emergency Response (15 phút)

**Mục tiêu**: Thể hiện luồng khẩn cấp end-to-end, STOMP WebSocket, real-time map.

**Bước 3.1 — Chuẩn bị Emergency Service (web)**
1. Đăng nhập web với tài khoản Emergency Service.
2. Vào trang Emergency Requests → đang trống.
3. Cập nhật vị trí của emergency service (gần vị trí User A) → `PATCH /emergency-service/location`.
4. **Điểm nhấn**: PostGIS `ST_Distance` sẽ chọn service gần nhất khi có SOS.

**Bước 3.2 — Voice SOS (User A, mobile)**
1. Đảm bảo microphone permission đã được cấp.
2. Nói to: **"Emergency now"**.
3. App navigate đến màn hình SOS đỏ, đếm ngược 10 giây.
4. Để đếm ngược chạy hết → SOS được gửi.
5. **Điểm nhấn**: `expo-speech-recognition` continuous mode, trigger phrase recognition.

**Bước 3.3 — Emergency Service nhận alert (web)**
1. Ngay lập tức, web dashboard (Emergency Service) nhận STOMP notification.
2. Toast/badge xuất hiện với thông tin yêu cầu.
3. Vào trang Emergency Requests → thấy request mới ở trạng thái PENDING.
4. **Điểm nhấn**: Redis pub/sub routing đến đúng pod giữ WebSocket session của service này.

**Bước 3.4 — Accept và theo dõi vị trí thời gian thực**
1. Emergency Service nhấn **Accept** → request chuyển sang ACCEPTED.
2. User A nhận STOMP notification trạng thái ACCEPTED trên mobile.
3. Web dashboard Emergency Service hiển thị real-time location của User A trên map.
4. Di chuyển điện thoại A → marker trên web map di chuyển theo (~5 giây delay).
5. **Điểm nhấn**: `location-updated` Kafka → `emergency-ops` consumer → Redis pub/sub → STOMP `/user/{serviceId}/queue/user-location`.

**Bước 3.5 — Đóng request**
1. Emergency Service nhấn **Close** → request CLOSED.
2. User A nhận notification CLOSED.

**Bước 3.6 — Crash Detection (optional, nếu có thiết bị)**
1. Bật crash detection trong Settings.
2. Lắc mạnh điện thoại (≥3g) hoặc demo ngưỡng accelerometer.
3. Local notification bật lên: "Crash detected - Send SOS?"
4. Nhấn notification → màn hình SOS mở với `autoActivate=1`.

---

### Phần 4 — Safe Zones (5 phút)

**Mục tiêu**: Thể hiện PostGIS spatial query và map overlay.

**Bước 4.1 — Tạo Safe Zone (web, Emergency Service)**
1. Vào Safe Zones → tạo zone mới tên "Central Hospital", bán kính 200m.
2. Chọn tọa độ trên map.
3. **Điểm nhấn**: tọa độ lưu dạng PostGIS POINT, column `geom` generated automatically.

**Bước 4.2 — Xem Safe Zones trên mobile**
1. Mobile app → Safe Zones screen → hiển thị danh sách và map overlay (vòng tròn xanh).
2. Gọi API `GET /safe-zone-locator/safe-zones/nearest` → PostGIS `ST_DWithin` trả về zones gần nhất.

---

### Phần 5 — Criminal Reports và AI (10 phút)

**Mục tiêu**: Thể hiện báo cáo tội phạm, heatmap, và AI chatbot.

**Bước 5.1 — Tạo báo cáo tội phạm (web, Reporter)**
1. Đăng nhập web với tài khoản Reporter.
2. Vào Crime Reports → Create New.
3. Điền title, chọn vị trí trên map (LocationPicker), severity 4/5, nội dung rich text (TinyMCE).
4. Upload ảnh minh họa.
5. Submit → file HTML lưu MinIO, metadata lưu Postgres với PostGIS point.
6. Nhấn **Publish** → báo cáo hiển thị công khai.

**Bước 5.2 — Crime Heatmap**
1. Trên mobile → tab Map → Crime Heatmap overlay.
2. Hoặc web → Crime Reports → Heatmap view.
3. Các điểm tội phạm hiển thị dưới dạng circles màu theo severity.
4. **Điểm nhấn**: API `/crime-locator/heatmap` dùng PostGIS `ST_DWithin` với bán kính.

**Bước 5.3 — Báo cáo người mất tích (web)**
1. Vào Missing Person Reports → Create.
2. Upload ảnh, điền thông tin nhân thân.
3. Submit → ảnh lưu MinIO, report ở trạng thái PENDING.
4. Publish → hiển thị công khai.

**Bước 5.4 — AI Chatbot với Guidelines (web)**
1. Vào Guidelines → mở một tài liệu hướng dẫn phòng tránh tội phạm.
2. Mở Chatbot panel bên phải.
3. Đặt câu hỏi: "Tôi nên làm gì khi bị theo dõi?"
4. AI trả lời dựa trên nội dung tài liệu (không hallucinate ngoài tài liệu).
5. **Điểm nhấn**: Spring AI + Gemini 2.0 Flash, context = full document, system prompt strict.
6. Đặt vài câu hỏi nữa → thấy session limit (tối đa 15 tin nhắn).

**Bước 5.5 — Dashboard Analytics**
1. Web → Dashboard home → thấy: tổng báo cáo, xu hướng 7 ngày, phân nhóm theo severity, hotspots.
2. Crime Analysis report → chọn khoảng thời gian → AI-generated summary.

---

## Điểm kỹ thuật nên nhấn mạnh khi demo

### Architecture
- **3 microservices độc lập**, mỗi service DB riêng → domain isolation thực sự.
- **Envoy as edge**: JWT validate một lần tại edge, không service nào tự verify signature.
- **Hai realm Keycloak**: users (public) vs reporters/emergency (restricted) → phân quyền tầng infrastructure.

### Real-time
- **gRPC streaming** cho location → không polling, push ngay khi có update.
- **Redis pub/sub** giải quyết multi-pod fan-out → scale horizontal mà không cần sticky session.
- **STOMP/SockJS** cho web emergency dashboard → bi-directional events.

### Spatial
- **PostGIS** cho tất cả tính năng location: tìm service gần nhất, safe zones, crime heatmap.
- **H3 hexagonal indexing** cho anomaly detection: uniform area, k-ring neighbors.
- **TimescaleDB hypertable** cho location history: chunk pruning theo thời gian.

### AI/ML
- **Spring AI + Gemini 2.0 Flash**: chatbot có context toàn bộ tài liệu.
- **H3 anomaly** không cần ML, chỉ cần đủ data → production-ready ngay.

### Mobile
- **Voice SOS** (speech recognition continuous mode) + **Crash Detection** (accelerometer native).
- **Background location** qua Kotlin foreground service → không bị kill bởi Android.
- **gRPC-Web** qua Envoy bridge → mobile dùng gRPC như native.

---

## Các tình huống edge case có thể được hỏi

| Câu hỏi | Trả lời |
|---|---|
| Scale như thế nào khi nhiều pods? | Redis pub/sub routing + Quartz clustered jobs, không cần sticky session |
| Emergency service offline thì sao? | STOMP session expire → WebSocket session registry dọn qua Quartz job mỗi 3 phút |
| OTP bị dùng hai lần? | Lua atomic fetch-and-delete trong Redis → không thể race condition |
| User chưa đủ data cho anomaly? | Cần ≥20 cell visits trong bucket trước khi detect |
| Kafka fail thì sao? | Dual-write risk được acknowledge → cần transactional outbox (known gap) |
| Safe zone chồng chéo? | API trả về tất cả zones trong bán kính, client render overlay |
| Chat vượt 15 tin nhắn? | Server từ chối, messageLeft=0 |
