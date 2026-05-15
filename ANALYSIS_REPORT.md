# Báo Cáo Phân Tích Kỹ Thuật — TrackNest

> Ngày tạo: 2026-05-11  
> Phạm vi: Mobile (TrackNest/Expo), Web (track-nest-web/Next.js), Backend (criminal-reports, emergency-ops, user-tracking)

---

## Mục Lục

1. [Luồng Tạo Missing Person Report](#1-luồng-tạo-missing-person-report)
2. [Luồng Tạo Crime Report](#2-luồng-tạo-crime-report)
3. [Luồng Thông Báo Family Chat](#3-luồng-thông-báo-family-chat)
4. [Luồng Thông Báo Emergency Request](#4-luồng-thông-báo-emergency-request)
5. [Tính Năng Upload Vị Trí & Cải Thiện](#5-tính-năng-upload-vị-trí--cải-thiện)

---

## 1. Luồng Tạo Missing Person Report

### 1.1 Mobile (frontend/TrackNest)

**Screen:** `frontend/TrackNest/app/(app)/create-missing.tsx`  
**Context/Service:** `frontend/TrackNest/contexts/ReportsContext.tsx` (lines 192–225)  
**API Service:** `frontend/TrackNest/services/criminalReports.ts`

#### Luồng UI (4 bước wizard):
1. **Bước 1** — Thông tin cơ bản: ảnh, họ tên, tên thường dùng
2. **Bước 2** — Chi tiết: tiêu đề, số CMND, ngày, mô tả
3. **Bước 3** — Liên hệ: điện thoại, email, chọn vị trí trên bản đồ
4. **Bước 4** — Xem lại trước khi gửi

#### Các trường form:
| Trường | Kiểu | Bắt buộc |
|--------|------|----------|
| `title` | string | ✅ |
| `fullName` | string | ✅ |
| `nickname` | string | ❌ |
| `personalId` | string | ✅ |
| `contactPhone` | string | ✅ |
| `contactEmail` | string | ❌ |
| `date` | ISO date string | ✅ |
| `description` | string | ✅ |
| `photoUri` | local URI | ❌ |
| `latitude`, `longitude` | float | ❌ |

#### Quy trình upload ảnh (mobile-specific):
- Upload ảnh **trực tiếp lên MinIO** thông qua `minioService.uploadFile()` **trước** khi gọi API tạo report
- Nhận về object URL từ MinIO, truyền vào request body dưới dạng string
- Nếu upload ảnh thất bại → tiếp tục tạo report mà **không có ảnh** (graceful fallback)

#### Endpoint gọi:
```
POST /report-user/missing-person-reports
Content-Type: multipart/form-data
```

---

### 1.2 Web (frontend/track-nest-web)

**Page:** `frontend/track-nest-web/app/dashboard/missing-persons/create/page.tsx`  
**Component:** `frontend/track-nest-web/components/missing-persons/MissingPersonForm.tsx` (lines 92–237)  
**Service:** `frontend/track-nest-web/services/criminalReportsService.ts` (lines 592–613)

#### Các trường form:
| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `title` | string | |
| `fullName` | string | |
| `personalId` | string | |
| `photo` | File object | Upload dưới dạng multipart |
| `date` | date | |
| `content` | HTML (TinyMCE) | Bao gồm mô tả ngoại hình chi tiết |
| `contactEmail` | string | |
| `contactPhone` | string | |
| `latitude`, `longitude` | float | |
| `age`, `gender`, `height`, `weight` | mixed | Nhúng trong content HTML |
| `hairColor`, `eyeColor`, `distinguishingFeatures` | string | Nhúng trong content HTML |

#### Quy trình upload ảnh (web):
- **CREATE mode**: File object được đưa thẳng vào FormData, backend xử lý lưu MinIO
- **EDIT mode**: Upload ngay lập tức qua `uploadFile()`, lưu URL string

#### Endpoint gọi:
```
POST /missing-person-request-receiver/submit
Content-Type: multipart/form-data
```

---

### 1.3 Backend (service/criminal-reports)

Có **3 endpoint** khác nhau cho missing person report:

| Endpoint | Controller | Kiểu request | Dùng bởi |
|----------|-----------|--------------|----------|
| `POST /report-user/missing-person-reports` | `ReportUserController` (lines 149–205) | `multipart/form-data` | Mobile |
| `POST /missing-person-request-receiver/submit` | `MissingPersonRequestReceiverController` (lines 38–105) | `multipart/form-data` | Web |
| `POST /report-manager/missing-person-reports` | `ReportManagerController` (lines 45–50) | JSON (`@RequestBody`) | Internal/Manager |

#### Xử lý ảnh (backend):
- Validate MIME type: chỉ chấp nhận `{image/png, image/jpeg, image/gif, image/webp}`
- Tạo tên file: `UUID + phần mở rộng gốc`
- Lưu vào MinIO bucket `criminal-reports`

#### Xử lý content:
- Tất cả content được **bọc thành HTML** và lưu thành file `.html` riêng trong MinIO:
  ```html
  <!doctype html><html><head><meta charset="utf-8"/></head><body>{content}</body></html>
  ```

---

### 1.4 So Sánh & Điểm Không Tương Đồng

| Khía cạnh | Mobile | Web | Backend |
|-----------|--------|-----|---------|
| **Upload ảnh** | Upload lên MinIO trực tiếp trước, truyền URL string | Gửi File object qua FormData | Nhận `MultipartFile`, tự lưu MinIO |
| **Content** | Plain string | HTML (TinyMCE) | Tự bọc thành HTML |
| **Mô tả ngoại hình** | Không có trường riêng | Có (age, gender, height, ...) nhúng vào HTML | Không validate, chỉ lưu content blob |
| **Endpoint** | `/report-user/missing-person-reports` | `/missing-person-request-receiver/submit` | 3 endpoint khác nhau |
| **Phân công reporter** | Không áp dụng | Round-robin (TODO note) | Có cơ chế phân công |
| **Validation ảnh** | Không validate MIME | Hạn chế | Strict (4 loại) |

> **Vấn đề nghiêm trọng**: Mobile upload ảnh lên MinIO trực tiếp rồi truyền URL string, trong khi backend endpoint `/report-user/` nhận `MultipartFile`. Hai bên đang dùng **cơ chế upload khác nhau hoàn toàn**. Cần xác nhận lại service `criminalReports.ts` ở mobile thực sự gọi đúng endpoint nào và theo cơ chế nào.

> **Vấn đề nội dung**: Web sử dụng TinyMCE để tạo HTML bao gồm thông tin ngoại hình. Mobile không có các trường này → missing person report từ mobile thiếu thông tin mô tả đặc điểm nhận dạng.

---

## 2. Luồng Tạo Crime Report

### 2.1 Mobile (frontend/TrackNest)

**Screen:** `frontend/TrackNest/app/(app)/create-report.tsx` (lines 1–492)  
**Service:** `frontend/TrackNest/services/criminalReports.ts`

#### Các trường form:
| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `title` | string | Bắt buộc |
| `description` | string | Bắt buộc |
| `severity` | "Low"\|"Medium"\|"High" | Map sang 1/3/5 |
| `latitude`, `longitude` | float | Mặc định: 10.7769, 106.6424 |
| `photoUris` | string[] | Tối đa 5 ảnh |
| `date` | ISO datetime | Auto-generate từ `Date.now()` |

#### API call (lines 76–84):
```typescript
criminalReportsService.submitUserCrimeReport({
  title, content: description,
  severity: 1 | 3 | 5,
  date,  // ISO datetime string
  latitude, longitude,
  photos: photoUris.map(uri => ({ uri }))
})
```

> **Lưu ý**: Mobile **không** có trường `numberOfVictims`, `numberOfOffenders`, `arrested` — các trường này chỉ có ở Web.

---

### 2.2 Web (frontend/track-nest-web)

**Page:** `frontend/track-nest-web/app/dashboard/crime-reports/create/page.tsx`  
**Component:** `frontend/track-nest-web/components/crime-reports/CrimeReportForm.tsx` (lines 80–202)  
**Service:** `frontend/track-nest-web/services/criminalReportsService.ts` (lines 346–368)

#### Các trường form:
| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `title` | string | |
| `content` | HTML (TinyMCE) | |
| `severity` | 1/3/5 | |
| `date` + `time` | Tách 2 trường | |
| `longitude`, `latitude` | float | |
| `numberOfVictims` | int | |
| `numberOfOffenders` | int | |
| `arrested` | boolean | |
| `selectedFiles[]` | File[] | Tối đa 5 ảnh |

#### Endpoint gọi:
```
POST /report-manager/crime-reports
Content-Type: multipart/form-data
```

---

### 2.3 Backend (service/criminal-reports)

**Controller:** `service/criminal-reports/.../controller/ReportUserController.java` (POST `/report-user/crime-reports`, lines 87–147)  
**Controller:** `service/criminal-reports/.../controller/ReportManagerController.java` (POST `/report-manager/crime-reports`, lines 120–159)

#### Trường nhận ở `/report-user/crime-reports`:
| Trường | Kiểu | Mặc định |
|--------|------|---------|
| `title` | String | Bắt buộc |
| `content` | String | Optional |
| `severity` | int | Bắt buộc |
| `date` | LocalDate | Bắt buộc |
| `longitude`, `latitude` | double | Bắt buộc |
| `numberOfVictims` | int | 0 |
| `numberOfOffenders` | int | 0 |
| `arrested` | boolean | false |
| `photos` | List\<MultipartFile\> | Optional |

> **Quan trọng**: Backend nhận `LocalDate` (chỉ ngày, **không có giờ**). Mobile gửi ISO datetime string → phần giờ/phút bị mất khi parse.

---

### 2.4 So Sánh & Điểm Không Tương Đồng

| Khía cạnh | Mobile | Web | Backend |
|-----------|--------|-----|---------|
| **Severity** | String "Low/Medium/High" → 1/3/5 | Số 1/3/5 trực tiếp | int 1–5 |
| **Date/Time** | ISO datetime (có giờ) | Date + Time tách biệt | `LocalDate` (chỉ ngày, mất giờ) |
| **numberOfVictims/Offenders** | ❌ Không có | ✅ Có | ✅ Có (default 0) |
| **arrested** | ❌ Không có | ✅ Có | ✅ Có (default false) |
| **Content** | Plain text | HTML (TinyMCE) | Bọc thành HTML file |
| **Endpoint** | `/report-user/crime-reports` | `/report-manager/crime-reports` | 2 endpoint khác nhau |
| **Upload ảnh** | Photos dưới dạng `{uri}` objects | File objects qua FormData | Nhận MultipartFile, lưu MinIO |

> **Kết luận**: Mobile thiếu 3 trường quan trọng (`numberOfVictims`, `numberOfOffenders`, `arrested`). Web và Backend đồng bộ tốt hơn. Mobile chỉ phù hợp cho trường hợp báo cáo nhanh (simplified report).

---

## 3. Luồng Thông Báo Family Chat

### 3.1 Proto Definition

**File:** `frontend/proto/familymessenger.proto`  
**Backend proto:** `service/user-tracking/src/main/proto/familymessenger.proto`

#### Các RPC:
| RPC | Kiểu | Mô tả |
|-----|------|-------|
| `SendMessage` | Unary | Gửi tin nhắn |
| `ListMessages` | Unary | Lấy lịch sử tin nhắn (phân trang) |
| `ReceiveMessageStream` | Server streaming | Stream realtime nhận tin nhắn |

---

### 3.2 Backend (service/user-tracking)

**Controller:** `service/user-tracking/.../controller/FamilyMessageController.java` (lines 16–41)  
**Service:** `service/user-tracking/.../domain/familymessenger/impl/FamilyMessengerServiceImpl.java` (lines 47–246)  
**FCM Service:** `service/user-tracking/.../configuration/firebase/FcmService.java` (lines 59–82)

#### Luồng xử lý khi gửi tin nhắn:

```
Client gọi gRPC SendMessage
    ↓
FamilyMessageController.sendMessage()
    ↓
FamilyMessengerServiceImpl.sendFamilyMessage()
    ├─ Lưu FamilyMessage vào DB (line 65)
    ├─ Publish message lên Redis (line 80) → gRPC streaming nhận
    └─ sendChatMessageFcmNotifications() (line 81)
        ├─ Query tất cả member trong circle (trừ sender) (lines 218–222)
        ├─ Lấy tất cả device token của recipients (lines 229–232)
        ├─ Build data payload: {type: "chat_message", route, circleId}
        └─ FcmService.sendToTokensWithData() (line 244)
            └─ FirebaseMessaging.sendEachForMulticast() → FCM
```

#### FCM Notification Payload:
```json
{
  "notification": {
    "title": "<sender_username>",
    "body": "<message_content>"
  },
  "data": {
    "type": "chat_message",
    "route": "/(app)/(tabs)/family-chat",
    "circleId": "<uuid>"
  }
}
```

#### Ai nhận thông báo:
- **Tất cả thành viên trong family circle, NGOẠI TRỪ người gửi** (line 221)
- FCM `sendEachForMulticast()` → gửi đến tất cả device tokens cùng lúc

---

### 3.3 Mobile (frontend/TrackNest)

**Chat Screen:** `frontend/TrackNest/app/(app)/(tabs)/family-chat.tsx`  
**gRPC Service:** `frontend/TrackNest/services/familyMessenger.ts` (lines 1–87)  
**Stream Hook:** `frontend/TrackNest/hooks/useChatStream.ts` (lines 33–120)  
**Background Task:** `frontend/TrackNest/services/backgroundTasks.ts` (lines 121–145)  
**Notifications:** `frontend/TrackNest/utils/notifications.ts` (lines 155–183)

#### Khi app ở foreground:
1. `useChatStream` duy trì gRPC stream liên tục
2. Tin nhắn đến → emit `CHAT_NEW_MESSAGE_EVENT`
3. FCM banner bị **suppress** (để tránh duplicate) — chỉ hiện notification local nếu tab chat không được focus
4. Chat screen cập nhật UI trực tiếp

#### Khi app ở background/killed:
1. FCM deliver notification → OS hiển thị tự động
2. `BACKGROUND_NOTIFICATION_TASK_NAME` chạy:
   - Chỉ xử lý type `"chat_message"` (line 136)
   - Tăng badge count trong AsyncStorage
3. User tap notification → mở app → gRPC stream kết nối lại

#### Hoạt động khi background: ✅ **CÓ**
- FCM đảm bảo delivery kể cả khi app bị kill
- OS tự hiển thị notification
- Background task xử lý badge count

---

### 3.4 Kết Luận Family Chat Notification

| Tiêu chí | Kết quả |
|---------|---------|
| Gửi đến tất cả thành viên circle | ✅ Có (trừ người gửi) |
| Hoạt động khi app ở foreground | ✅ Có (gRPC stream realtime) |
| Hoạt động khi app ở background | ✅ Có (FCM) |
| Hoạt động khi app bị kill | ✅ Có (FCM OS delivery) |
| Tránh duplicate notification | ✅ Có (suppress FCM banner khi stream active) |
| Badge count đồng bộ | ✅ Có (AsyncStorage + khởi tạo lại stream) |

---

## 4. Luồng Thông Báo Emergency Request

### 4.1 Backend (service/emergency-ops)

**Service:** `service/emergency-ops/.../domain/emergencyrequestreceiver/impl/EmergencyRequestReceiverServiceImpl.java` (lines 107–151)  
**Kafka topics:** `application.yaml` (lines 79–82)  
**STOMP queues:** `application.yaml` (lines 102–105)

#### Khi Emergency Request được tạo — 2 kênh thông báo song song:

```
POST /emergency-request-receiver/request
    ↓
EmergencyRequestReceiverServiceImpl.createEmergencyRequest()
    ├─ [Kênh 1] Kafka publish → tracking-notification topic (line 125)
    │   Payload: TrackingNotificationMessage {
    │     targetId,           ← TARGET USER (người cần cứu trợ)
    │     title: "Emergency Assistance Dispatched",
    │     type: "EMERGENCY_REQUEST_ASSIGNED"
    │   }
    │   → Kafka → user-tracking service → FCM → TARGET USER's device
    │
    └─ [Kênh 2] Redis publish (line 137)
        Payload: ServerRedisMessage { method: "receiveEmergencyRequestMessage" }
        → Redis → ServerRedisMessageReceiver (line 46)
        → STOMP /user/{serviceId}/queue/emergency-request
        → EMERGENCY SERVICE web dashboard
```

#### Realtime location tracking (sau khi request được tạo):

```
Kafka listener: location-updated topic
    ↓
EmergencyResponderTrigger.java (line 17)
    ↓
EmergencyResponderServiceImpl.trackTarget()
    ├─ Persist location (line 61)
    └─ Redis publish → STOMP /user/{serviceId}/queue/user-location
        → EMERGENCY SERVICE nhận vị trí realtime
```

#### Khi Accept/Reject/Close — **KHÔNG CÓ NOTIFICATION**:
- `acceptEmergencyRequest()` (lines 117–167): Chỉ update status, không gửi thông báo
- `rejectEmergencyRequest()` (lines 171–210): Chỉ update status, không gửi thông báo
- `closeEmergencyRequest()` (lines 214–263): Chỉ update status, không gửi thông báo

---

### 4.2 Web (frontend/track-nest-web)

**STOMP Service:** `frontend/track-nest-web/services/stompService.ts` (lines 10–43)  
**Realtime Context:** `frontend/track-nest-web/contexts/EmergencyRequestRealtimeContext.tsx` (lines 30–103)  
**Emergency Page:** `frontend/track-nest-web/app/dashboard/emergency-requests/page.tsx`

#### Luồng nhận thông báo (Web):

```
STOMP kết nối: ${WS_BASE_URL}?access_token=${token}
    ↓
Subscribe: /user/queue/emergency-request
    ↓
Nhận AssignedEmergencyRequestMessage
    ├─ Hiển thị notification "New Emergency Request"
    ├─ Tăng refresh counter
    └─ Trigger re-fetch danh sách request
```

#### Điều kiện kết nối:
- Chỉ kết nối cho user có role `EMERGENCY_SERVICE` (line 41)
- Không có subscription cho `/user/queue/user-location` trên web → **không nhận realtime location** trên web

#### Admin dashboard:
- **Không có STOMP subscription** — chỉ polling thủ công
- Không nhận realtime updates

---

### 4.3 Mobile (frontend/TrackNest)

**Push Notifications:** `frontend/TrackNest/hooks/usePushNotifications.ts` (lines 26–118)  
**Background Task:** `frontend/TrackNest/services/backgroundTasks.ts` (lines 127–146)

#### Khi nhận FCM notification với type `EMERGENCY_REQUEST_ASSIGNED`:
```typescript
// usePushNotifications.ts line 66–67
if (data.type === "EMERGENCY_REQUEST_ASSIGNED") {
  router.push("/(app)/sos");  // Navigate to SOS screen
}
```

#### Background handling:
- `BACKGROUND_NOTIFICATION_TASK_NAME` **chỉ xử lý** `chat_message` type (line 136)
- Emergency notifications **KHÔNG có handler riêng** trong background task
- Dựa vào OS auto-display (notification field trong FCM payload)
- Nếu FCM gửi data-only message → **không hiển thị** khi app bị kill

---

### 4.4 Bảng Tổng Hợp — Ai Nhận Thông Báo Gì

| Người nhận | Sự kiện | Kênh | Hoạt động? |
|-----------|---------|------|-----------|
| **Target User** | Request được tạo | Kafka → FCM push | ✅ Có |
| **Target User** | Request accepted/rejected/closed | — | ❌ Không |
| **Emergency Service** | Request được assign | Redis → WebSocket STOMP | ✅ Có (realtime) |
| **Emergency Service** | Vị trí target user cập nhật | Kafka → Redis → STOMP | ✅ Có (realtime) |
| **Family Members** | Request được tạo | — | ❌ Không implement |
| **Family Members** | Thay đổi status | — | ❌ Không implement |
| **Admin** | Bất kỳ sự kiện nào | — | ❌ Chỉ polling |

---

### 4.5 Vấn Đề Nghiêm Trọng Phát Hiện

#### Vấn đề 1: Target User không nhận thông báo status change
**Ảnh hưởng**: Người dùng tạo SOS request không biết khi nào có người chấp nhận, từ chối, hoặc đóng request.

#### Vấn đề 2: Background task mobile không handle emergency notification
**File:** `frontend/TrackNest/services/backgroundTasks.ts:136`  
**Ảnh hưởng**: Nếu FCM gửi data-only emergency message khi app bị kill → không có gì xảy ra. Chỉ an toàn khi FCM gửi notification+data message.

#### Vấn đề 3: Web không nhận realtime location
**Ảnh hưởng**: Emergency service operator trên web không thấy vị trí realtime của target user dù backend đã implement. Subscription `/user/queue/user-location` không được đăng ký ở web.

#### Vấn đề 4: Family members không được thông báo
**Ảnh hưởng**: Khi một thành viên gia đình gặp nguy hiểm và tạo SOS, các thành viên khác trong family circle không nhận được bất kỳ thông báo nào.

---

## 5. Tính Năng Upload Vị Trí & Cải Thiện

### 5.1 Hiện Trạng — Tần Suất Upload

**Câu trả lời trực tiếp**: Upload vị trí hiện tại diễn ra **tối thiểu mỗi 15 phút** (900 giây).

```typescript
// frontend/TrackNest/utils/backgroundLocation.ts:71
await BackgroundTask.registerTaskAsync(taskName, {
  minimumInterval: 15 * 60,  // 900 giây = 15 phút
});
```

#### Chi tiết theo từng layer:

| Layer | File | Tần suất | Ghi chú |
|-------|------|---------|---------|
| **Thu thập (Native Android)** | `NativeLocationService.kt:36–42` | 60s (Normal) / 5s (Navigation) | FusedLocationProviderClient, HIGH_ACCURACY |
| **Thu thập (Expo fallback)** | `useDeviceLocation.ts:114–118` | 5s | Dùng khi native service không khả dụng |
| **Queue & merge** | `locationMerge.ts:131–173` | Theo sự kiện | Lọc độ chính xác, dedup, gộp điểm gần nhau |
| **Upload lên server** | `backgroundLocation.ts:71` | **15 phút** | `expo-background-task` |
| **Gửi qua gRPC** | `tracker.ts:95–127` | Khi task chạy | Batch tất cả điểm đã queue |

**Vấn đề**: Native module **chỉ thu thập** vị trí (mỗi 5–60s) nhưng **không trigger upload**. Toàn bộ batch vị trí tích lũy được gửi một lần sau mỗi 15 phút.

---

### 5.2 Backend sau khi nhận vị trí

**Controller:** `service/user-tracking/.../controller/TrackerController.java` (lines 69–80)  
**Service:** `service/user-tracking/.../domain/tracker/locationcommand/impl/LocationCommandServiceImpl.java` (lines 34–99)

#### Luồng xử lý:
```
gRPC UpdateUserLocation() nhận batch locations
    ↓
LocationCommandServiceImpl
    ├─ Validate timestamp (reject nếu > 5 phút trong tương lai)
    ├─ Lưu vào TimescaleDB (hypertable)
    ├─ Update user.connected = true, user.lastActive = now
    ├─ Publish Kafka: location-updated topic
    │   Payload: {userId, username, lat/lng, accuracy, velocity, timestamp}
    └─ Chạy anomaly detection (H3 geospatial)
        └─ Nếu phát hiện bất thường → Kafka: tracking-notification → FCM → family members
```

> Backend **không gửi push notification xác nhận** về cho thiết bị đã upload. Chỉ gửi FCM khi phát hiện anomaly.

---

### 5.3 Thông Báo Đẩy Sau Khi Upload Thành Công

#### Hiện trạng:
**File:** `frontend/TrackNest/utils/notifications.ts` (lines 195–235)

```typescript
// Hàm scheduleUploadStatusNotification()
// Statuses: "success" | "no_network" | "failed"
await Notifications.scheduleNotificationAsync({
  content: {
    title: status === "success" ? "Location Synced" : "...",
    body: "...",
    channelId: LOCATION_UPLOAD_CHANNEL_ID
  },
  trigger: null  // Hiển thị ngay lập tức
});
```

**Vấn đề**: Mỗi lần upload tạo ra **một notification mới** — không có cơ chế ghi đè notification cũ. Nhiều notification sẽ chồng chất sau nhiều lần upload.

#### Cách implement ghi đè notification (không cần sửa code hiện tại, đây là hướng dẫn):

**Trên Android**, `expo-notifications` hỗ trợ `identifier` để replace notification:
```typescript
// Lưu ID notification trước
const prevId = await AsyncStorage.getItem("LAST_LOCATION_NOTIF_ID");

// Cancel notification cũ trước khi tạo mới
if (prevId) {
  await Notifications.dismissNotificationAsync(prevId);
}

// Tạo notification mới
const id = await Notifications.scheduleNotificationAsync({
  content: { title: "Location Synced", ... },
  trigger: null
});

// Lưu ID mới
await AsyncStorage.setItem("LAST_LOCATION_NOTIF_ID", id);
```

Hoặc dùng `android.tag` để Android tự replace:
```typescript
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Location Synced",
    ...(Platform.OS === "android" && {
      // android.tag không được expo-notifications expose trực tiếp
      // Cần dùng native module hoặc identifier approach
    }),
    data: { tag: "location_upload_status" }
  },
  trigger: null,
  identifier: "location_upload_status"  // Identifier cố định → replace
});
```

> **Khuyến nghị**: Dùng `identifier: "location_upload_status"` cố định khi gọi `scheduleNotificationAsync`. Expo sẽ replace notification cũ có cùng identifier.

---

### 5.4 Cải Thiện Tần Suất Upload với Native Module

#### Hiện trạng Native Module:
**File:** `frontend/TrackNest/android/app/src/main/java/com/project/tracknest/NativeLocationService.kt`  
**Bridge:** `frontend/TrackNest/android/app/src/main/java/com/project/tracknest/NativeLocationModule.kt`

Native module **đã tồn tại** với:
- Foreground service chạy liên tục
- Thu thập vị trí mỗi 5–60s tùy mode
- **Chưa** có chức năng trigger upload

#### Có thể cải thiện không?

**Có thể** cải thiện đáng kể bằng cách mở rộng native module:

**Cách 1 — Trigger upload từ Native Service (khuyến nghị)**:
- Thêm callback từ `NativeLocationService.kt` về React Native mỗi khi có location mới
- React Native nhận event → gọi `uploadLocations()` ngay lập tức
- Hiệu quả: từ upload 15 phút/lần → gần như realtime (5–60s/lần)
- Không cần đợi `expo-background-task` schedule

**Cách 2 — Android WorkManager trong Native Module**:
- Dùng `WorkManager` với `PeriodicWorkRequest` (minimum 15 phút theo Android policy)
- Tương tự `expo-background-task` nhưng có thể chạy khi app bị kill
- Ưu điểm: reliable hơn so với Expo background task

**Cách 3 — Upload trực tiếp từ Kotlin (no React bridge)**:
- `NativeLocationService.kt` gọi gRPC endpoint trực tiếp (OkHttp + gRPC)
- Không phụ thuộc React Native bridge
- Upload ngay khi có location mới

#### So sánh tần suất:

| Phương án | Upload interval | Background | App killed |
|-----------|----------------|-----------|-----------|
| Hiện tại (expo-background-task) | ~15 phút | ✅ | ⚠️ Không đảm bảo |
| Native module trigger | ~60s (Normal) / ~5s (Nav) | ✅ | ✅ |
| WorkManager | ~15 phút (Android min) | ✅ | ✅ |
| WorkManager + foreground service | ~60s / ~5s | ✅ | ✅ |

> **Kết luận**: Kiến trúc native đã có sẵn (foreground service), chỉ cần thêm logic trigger upload trong `NativeLocationService.kt` thay vì dùng `expo-background-task`. Điều này có thể giảm latency từ 15 phút xuống còn 60s (hoặc 5s với Navigation mode).

---

### 5.5 Tóm Tắt Vấn Đề & Khuyến Nghị

| Vấn đề | Hiện trạng | Khuyến nghị |
|--------|-----------|-------------|
| Upload quá thưa (15 phút) | Background task minimum 900s | Dùng native foreground service trigger upload |
| Notification chồng chất | Mỗi upload tạo 1 notification mới | Dùng `identifier` cố định để replace |
| Không có xác nhận upload | Chỉ local notification, không có push từ server | Backend không cần thay đổi, chỉ cần fix mobile-side |
| Android policy giới hạn background | `expo-background-task` bị OS throttle | Native foreground service bypass giới hạn này |

---

## Phụ Lục — Bảng Tổng Hợp File Quan Trọng

### criminal-reports Service
| File | Mục đích |
|------|---------|
| `service/criminal-reports/.../controller/ReportUserController.java` | Endpoint cho mobile |
| `service/criminal-reports/.../controller/ReportManagerController.java` | Endpoint cho manager/web |
| `service/criminal-reports/.../controller/MissingPersonRequestReceiverController.java` | Endpoint nhận báo cáo |
| `service/criminal-reports/.../domain/reportmanager/dto/CreateCrimeReportRequest.java` | DTO crime report |
| `service/criminal-reports/.../domain/reportmanager/dto/CreateMissingPersonReportRequest.java` | DTO missing person |

### emergency-ops Service
| File | Mục đích |
|------|---------|
| `service/emergency-ops/.../domain/emergencyrequestreceiver/impl/EmergencyRequestReceiverServiceImpl.java` | Tạo request + send notifications |
| `service/emergency-ops/.../domain/emergencyrequestmanager/impl/EmergencyRequestManagerServiceImpl.java` | Accept/reject/close (thiếu notifications) |
| `service/emergency-ops/.../domain/emergencyresponder/impl/EmergencyResponderServiceImpl.java` | Track vị trí realtime |
| `service/emergency-ops/.../domain/emergencyresponder/impl/EmergencyResponderTrigger.java` | Kafka listener location-updated |

### user-tracking Service
| File | Mục đích |
|------|---------|
| `service/user-tracking/.../controller/FamilyMessageController.java` | gRPC family chat |
| `service/user-tracking/.../domain/familymessenger/impl/FamilyMessengerServiceImpl.java` | Business logic + FCM |
| `service/user-tracking/.../configuration/firebase/FcmService.java` | Firebase FCM wrapper |
| `service/user-tracking/.../controller/TrackerController.java` | gRPC location upload |
| `service/user-tracking/.../domain/tracker/locationcommand/impl/LocationCommandServiceImpl.java` | Xử lý vị trí |

### Mobile (frontend/TrackNest)
| File | Mục đích |
|------|---------|
| `frontend/TrackNest/app/(app)/create-missing.tsx` | UI tạo missing person report |
| `frontend/TrackNest/app/(app)/create-report.tsx` | UI tạo crime report |
| `frontend/TrackNest/contexts/ReportsContext.tsx` | Logic tạo reports |
| `frontend/TrackNest/services/criminalReports.ts` | API calls criminal reports |
| `frontend/TrackNest/app/(app)/(tabs)/family-chat.tsx` | UI family chat |
| `frontend/TrackNest/hooks/useChatStream.ts` | gRPC stream quản lý |
| `frontend/TrackNest/utils/backgroundLocation.ts` | Đăng ký background tasks |
| `frontend/TrackNest/services/backgroundTasks.ts` | Định nghĩa background tasks |
| `frontend/TrackNest/utils/notifications.ts` | Tất cả notification helpers |
| `frontend/TrackNest/android/.../NativeLocationService.kt` | Native Android foreground service |
| `frontend/TrackNest/android/.../NativeLocationModule.kt` | React Native bridge |
| `frontend/TrackNest/hooks/usePushNotifications.ts` | FCM registration + routing |

### Web (frontend/track-nest-web)
| File | Mục đích |
|------|---------|
| `frontend/track-nest-web/components/crime-reports/CrimeReportForm.tsx` | Form tạo crime report |
| `frontend/track-nest-web/components/missing-persons/MissingPersonForm.tsx` | Form tạo missing person |
| `frontend/track-nest-web/services/criminalReportsService.ts` | API calls |
| `frontend/track-nest-web/services/stompService.ts` | WebSocket STOMP client |
| `frontend/track-nest-web/contexts/EmergencyRequestRealtimeContext.tsx` | Realtime emergency context |
