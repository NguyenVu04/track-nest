# Kế Hoạch Triển Khai — TrackNest

> Ngày tạo: 2026-05-11  
> Tài liệu tham chiếu: `ANALYSIS_REPORT.md`  
> Nguyên tắc: Không thay đổi file nào trừ các file được liệt kê rõ trong từng task.

---

## Mục Lục

- [Task 1 — Missing Person Report: Upload ảnh multipart + Thêm trường mô tả ngoại hình](#task-1)
- [Task 2 — Crime Report: Thêm trường còn thiếu + Sửa format ngày tháng](#task-2)
- [Task 3 — Family Chat Notification: Xác minh tính đúng đắn](#task-3)
- [Task 4 — Emergency Request Notification: Sửa các lỗ hổng nghiêm trọng](#task-4)
- [Task 5 — Native Location Upload: gRPC trực tiếp từ Kotlin](#task-5)

---

## Task 1

### Missing Person Report: Upload ảnh multipart + Thêm trường mô tả ngoại hình

---

### Phân tích hiện trạng

**Luồng hiện tại (SAI):**

```
create-missing.tsx
  → useReports().createMissingPersonReport(data, photoUri)
  → ReportsContext.tsx:192
      → minioService.uploadFile(photoUri)          ← Upload ảnh trực tiếp lên MinIO
      → criminalReportsService.createMissingPersonReport(data + photoUrl)
          → POST /report-manager/missing-person-reports   ← SAI endpoint, JSON body
```

**Luồng đúng (như web):**

```
create-missing.tsx
  → criminalReportsService.submitUserMissingPersonReport(params)
      → POST /report-user/missing-person-reports   ← Đúng endpoint
          Content-Type: multipart/form-data
          Ảnh gửi dưới dạng MultipartFile
```

**`submitUserMissingPersonReport` đã tồn tại** tại `frontend/TrackNest/services/criminalReports.ts:524–551` và đúng cả về endpoint lẫn multipart. Vấn đề là UI (`create-missing.tsx`) chưa gọi hàm này.

**Trường còn thiếu so với Web:**  
Web nhúng vào HTML content: `age`, `gender`, `height`, `weight`, `hairColor`, `eyeColor`, `distinguishingFeatures`. Mobile hiện không có các trường này.

---

### Các file cần chỉnh sửa

| File | Thao tác | Lý do |
|------|---------|-------|
| `frontend/TrackNest/app/(app)/create-missing.tsx` | Sửa | Thêm trường ngoại hình, đổi hàm submit |
| `frontend/TrackNest/types/criminalReports.ts` | Sửa | Thêm trường ngoại hình vào `SubmitMissingPersonReportUserParams` |

`ReportsContext.tsx`, `criminalReports.ts` **KHÔNG cần sửa** — `submitUserMissingPersonReport` đã hoạt động đúng.

---

### Chi tiết thay đổi

#### 1.1 `frontend/TrackNest/types/criminalReports.ts`

Thêm các trường optional vào `SubmitMissingPersonReportUserParams`:

```typescript
// Trước (lines 130-141)
export interface SubmitMissingPersonReportUserParams {
  title: string;
  fullName: string;
  personalId: string;
  content: string;
  photo?: { uri: string; filename?: string; type?: string };
  contactEmail: string;
  contactPhone: string;
  date: string;
  latitude: number;
  longitude: number;
}

// Sau — thêm trường ngoại hình
export interface SubmitMissingPersonReportUserParams {
  title: string;
  fullName: string;
  personalId: string;
  content: string;
  photo?: { uri: string; filename?: string; type?: string };
  contactEmail: string;
  contactPhone: string;
  date: string;
  latitude: number;
  longitude: number;
  // Physical description (optional, nhúng vào HTML content khi submit)
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  hairColor?: string;
  eyeColor?: string;
  distinguishingFeatures?: string;
}
```

> Các trường mới chỉ dùng tại UI để build HTML content — `submitUserMissingPersonReport` trong service không cần đổi vì chúng đã được nhúng vào `content` trước khi gọi.

#### 1.2 `frontend/TrackNest/app/(app)/create-missing.tsx`

**Thêm state cho trường ngoại hình** (thêm sau `const [description, setDescription] = useState("")`):
```typescript
const [age, setAge] = useState("");
const [gender, setGender] = useState(""); // "Male" | "Female" | "Other"
const [height, setHeight] = useState("");        // cm
const [weight, setWeight] = useState("");        // kg
const [hairColor, setHairColor] = useState("");
const [eyeColor, setEyeColor] = useState("");
const [distinguishingFeatures, setDistinguishingFeatures] = useState("");
```

**Thêm Step mới (hoặc mở rộng Step 2)** với các input tương ứng.  
Khuyến nghị: Tách thành **Step 2b — Đặc điểm ngoại hình** (tăng totalSteps từ 4 lên 5) để không làm Step 2 quá dài.

**Build HTML content** trong `handleSubmit` (thay thế `finalContent` hiện tại):

```typescript
// Thay thế đoạn build finalContent hiện tại
const buildHtmlContent = () => {
  const physicalLines: string[] = [];
  if (nickname) physicalLines.push(`<p><strong>Known as:</strong> ${nickname}</p>`);
  if (age) physicalLines.push(`<p><strong>Age:</strong> ${age}</p>`);
  if (gender) physicalLines.push(`<p><strong>Gender:</strong> ${gender}</p>`);
  if (height) physicalLines.push(`<p><strong>Height:</strong> ${height} cm</p>`);
  if (weight) physicalLines.push(`<p><strong>Weight:</strong> ${weight} kg</p>`);
  if (hairColor) physicalLines.push(`<p><strong>Hair Color:</strong> ${hairColor}</p>`);
  if (eyeColor) physicalLines.push(`<p><strong>Eye Color:</strong> ${eyeColor}</p>`);
  if (distinguishingFeatures) physicalLines.push(`<p><strong>Distinguishing Features:</strong> ${distinguishingFeatures}</p>`);

  const physicalSection = physicalLines.length > 0
    ? `<h3>Physical Description</h3>${physicalLines.join("")}`
    : "";

  return `${physicalSection}<h3>Description</h3><p>${description}</p>`;
};
```

**Sửa `handleSubmit`** — đổi từ `createMissingPersonReport` (context) sang `submitUserMissingPersonReport` (service trực tiếp):

```typescript
// Trước
await createMissingPersonReport(
  { title, fullName, personalId, contactPhone, contactEmail, date,
    content: finalContent.trim(), latitude, longitude },
  photoUri ?? undefined,
);

// Sau
await criminalReportsService.submitUserMissingPersonReport({
  title: title.trim(),
  fullName: fullName.trim(),
  personalId: personalId.trim(),
  contactPhone: contactPhone.trim(),
  contactEmail: contactEmail.trim() || "",
  date,                              // đã là YYYY-MM-DD (line 49)
  content: buildHtmlContent(),
  latitude,
  longitude,
  photo: photoUri
    ? { uri: photoUri, filename: `photo_${Date.now()}.jpg`, type: "image/jpeg" }
    : undefined,
});
```

**Import thêm** `criminalReportsService` vào file:
```typescript
import { criminalReportsService } from "@/services/criminalReports";
```

**Xóa import** `useReports` nếu không còn dùng cho mục đích khác.

---

### Điểm cần lưu ý khi implement

- `contactEmail` trong `SubmitMissingPersonReportUserParams` là `string` (không phải `string | undefined`) nên cần truyền `""` khi rỗng hoặc sửa type thành optional. Kiểm tra backend có accept `contactEmail = ""` không — nếu không, sửa type thành `contactEmail?: string` và bỏ trường ra khỏi FormData khi rỗng trong service.
- Backend wraps content thành HTML file → không cần gửi full HTML document, chỉ gửi HTML fragment (đoạn `<h3>...<p>...`) là đủ vì backend tự bọc `<!doctype html>...`.
- `date` hiện đã lấy đúng format `YYYY-MM-DD` (line 49 của create-missing.tsx: `new Date().toISOString().split("T")[0]`).

---

## Task 2

### Crime Report: Thêm trường còn thiếu + Sửa format ngày tháng

---

### Phân tích hiện trạng

**File:** `frontend/TrackNest/app/(app)/create-report.tsx`

**Vấn đề 1 — Date format (line 80):**
```typescript
date: new Date().toISOString(),  // "2026-05-11T03:00:00.000Z" — có giờ/phút
```
Backend nhận `LocalDate` → Spring parse `LocalDate.parse(value)` — nếu gửi full ISO datetime, Spring sẽ ném `DateTimeParseException` với `@RequestParam LocalDate date`. Cần gửi chỉ phần ngày.

**Vấn đề 2 — Trường thiếu:**  
`numberOfVictims`, `numberOfOffenders`, `arrested` không có trong UI. `submitUserCrimeReport` đã có các trường này nhưng UI chỉ dùng giá trị default (0, 0, false).

---

### Các file cần chỉnh sửa

| File | Thao tác | Lý do |
|------|---------|-------|
| `frontend/TrackNest/app/(app)/create-report.tsx` | Sửa | Thêm fields, sửa date format |

`criminalReports.ts` và `types/criminalReports.ts` **KHÔNG cần sửa** — đã có đầy đủ.

---

### Chi tiết thay đổi

#### 2.1 `frontend/TrackNest/app/(app)/create-report.tsx`

**Thêm state** (thêm sau `const [loading, setLoading] = useState(false)`):
```typescript
const [numberOfVictims, setNumberOfVictims] = useState(0);
const [numberOfOffenders, setNumberOfOffenders] = useState(0);
const [arrested, setArrested] = useState(false);
```

**Thêm UI** — Trong `ScrollView`, sau phần severity, trước phần images:

```tsx
{/* Số nạn nhân */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>
    {t.numberOfVictimsLabel || "Number of Victims"}
  </Text>
  <View style={styles.counterRow}>
    <Pressable onPress={() => setNumberOfVictims(Math.max(0, numberOfVictims - 1))}>
      <Ionicons name="remove-circle-outline" size={28} color={colors.primary} />
    </Pressable>
    <Text style={styles.counterValue}>{numberOfVictims}</Text>
    <Pressable onPress={() => setNumberOfVictims(numberOfVictims + 1)}>
      <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
    </Pressable>
  </View>
</View>

{/* Số người gây án */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>
    {t.numberOfOffendersLabel || "Number of Offenders"}
  </Text>
  <View style={styles.counterRow}>
    <Pressable onPress={() => setNumberOfOffenders(Math.max(0, numberOfOffenders - 1))}>
      <Ionicons name="remove-circle-outline" size={28} color={colors.primary} />
    </Pressable>
    <Text style={styles.counterValue}>{numberOfOffenders}</Text>
    <Pressable onPress={() => setNumberOfOffenders(numberOfOffenders + 1)}>
      <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
    </Pressable>
  </View>
</View>

{/* Đã bắt giữ */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>{t.arrestedLabel || "Arrested"}</Text>
  <Pressable
    style={[styles.toggleBtn, arrested && styles.toggleBtnActive]}
    onPress={() => setArrested(!arrested)}
  >
    <Text style={[styles.toggleText, arrested && styles.toggleTextActive]}>
      {arrested ? (t.yes || "Yes") : (t.no || "No")}
    </Text>
  </Pressable>
</View>
```

**Sửa `handleSubmit`** (thay đổi 2 dòng):

```typescript
// Trước (line 80)
date: new Date().toISOString(),

// Sau — chỉ lấy phần ngày YYYY-MM-DD
date: new Date().toISOString().split("T")[0],

// Thêm các trường mới vào call (sau longitude)
numberOfVictims,
numberOfOffenders,
arrested,
```

**Thêm styles** vào `StyleSheet.create`:
```typescript
counterRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 16,
  paddingVertical: 8,
},
counterValue: {
  fontSize: 20,
  fontWeight: "700",
  color: "#333",
  minWidth: 32,
  textAlign: "center",
},
toggleBtn: {
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 12,
  backgroundColor: "#f2f6f9",
  borderWidth: 1,
  borderColor: "#dce4e8",
  alignSelf: "flex-start",
},
toggleBtnActive: {
  backgroundColor: "#eefcf1",
  borderColor: "#27ae60",
},
toggleText: { fontSize: 15, fontWeight: "600", color: "#555" },
toggleTextActive: { color: "#27ae60" },
```

---

## Task 3

### Family Chat Notification: Xác minh tính đúng đắn

---

### Kết quả xác minh

Sau khi đọc trực tiếp các file liên quan:

| File | Kiểm tra | Kết quả |
|------|---------|---------|
| `frontend/TrackNest/proto/familymessenger.proto:59` | `sender_name` có trong Message proto? | ✅ Có (field 5) |
| `frontend/TrackNest/hooks/useChatStream.ts:65` | `msg.senderName` — có khớp với proto? | ✅ Khớp |
| `frontend/TrackNest/utils/notifications.ts:10–27` | FCM banner bị suppress cho `chat_message` khi foreground? | ✅ Đúng |
| `frontend/TrackNest/hooks/useChatStream.ts:59–60` | Skip notification cho tin nhắn của chính mình + khi tab đang focus? | ✅ Đúng |
| `frontend/TrackNest/services/backgroundTasks.ts:127–145` | Background task tăng badge count? | ✅ Có |
| `service/user-tracking/.../FamilyMessengerServiceImpl.java:218–222` | Loại trừ sender khỏi recipient list? | ✅ Có |
| `service/user-tracking/.../FcmService.java:59–82` | Gửi multicast FCM? | ✅ `sendEachForMulticast` |

**Luồng hoạt động chính xác:**

```
Foreground (chat tab focused)  → gRPC stream cập nhật UI, không có notification (đúng)
Foreground (tab khác)          → gRPC stream emit event + local notification hiện (đúng)
Background / killed            → FCM → OS hiện notification → background task tăng badge (đúng)
Mở app từ notification         → addNotificationResponseReceivedListener → navigate về chat (đúng)
```

**Kết luận: Không có lỗi trong luồng family chat notification. Không cần sửa.**

---

## Task 4

### Emergency Request Notification: Sửa các lỗ hổng nghiêm trọng

---

### Tóm tắt vấn đề

| # | Vấn đề | Mức độ |
|---|--------|--------|
| 4a | Target user không nhận notification khi request accepted/rejected/closed | Nghiêm trọng |
| 4b | Family members không được thông báo khi SOS được tạo/thay đổi | Nghiêm trọng |
| 4c | Web không nhận realtime location của target user | Trung bình |
| 4d | Emergency notification không có handler riêng trong background task mobile | Nhẹ |

> **Về 4b**: Khi fix 4a (thêm Kafka publish cho accept/reject/close), vấn đề 4b cũng được giải quyết tự động — vì user-tracking service đã lấy family members của `targetId` và gửi FCM cho tất cả.

---

### Các file cần chỉnh sửa

| File | Task | Lý do |
|------|------|-------|
| `service/emergency-ops/.../domain/emergencyrequestmanager/impl/EmergencyRequestManagerServiceImpl.java` | 4a | Thêm Kafka publish cho accept/reject/close |
| `frontend/track-nest-web/contexts/EmergencyRequestRealtimeContext.tsx` | 4c | Thêm subscription nhận realtime location |
| `frontend/track-nest-web/app/dashboard/emergency-requests/page.tsx` | 4c | Hiển thị realtime location từ context |
| `frontend/TrackNest/services/backgroundTasks.ts` | 4d | Thêm handler cho emergency notification types |
| `frontend/TrackNest/hooks/usePushNotifications.ts` | 4a | Thêm handler cho notification types mới |

---

### 4a — Backend: Thêm Kafka notification cho accept/reject/close

**File:** `service/emergency-ops/src/main/java/project/tracknest/emergencyops/domain/emergencyrequestmanager/impl/EmergencyRequestManagerServiceImpl.java`

**Bước 1** — Thêm import và inject dependencies:

```java
// Thêm imports
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import project.tracknest.emergencyops.core.datatype.TrackingNotificationMessage;

// Thêm vào class (sau các @Value hiện có)
@Value("${app.kafka.topics[1]}")
private String TOPIC;

private final KafkaTemplate<String, TrackingNotificationMessage> kafkaTemplate;
```

**Lưu ý:** `KafkaTemplate<String, TrackingNotificationMessage>` phải match bean đã được autowire từ Kafka config. Kiểm tra xem bean này đã tồn tại trong `EmergencyRequestReceiverServiceImpl.java` (đã có) — Spring sẽ share bean tự động với `@RequiredArgsConstructor`.

**Bước 2** — Thêm constants ở đầu class (sau dòng constants hiện có):

```java
private static final String TYPE_ACCEPTED  = "EMERGENCY_REQUEST_ACCEPTED";
private static final String TYPE_REJECTED  = "EMERGENCY_REQUEST_REJECTED";
private static final String TYPE_CLOSED    = "EMERGENCY_REQUEST_CLOSED";
```

**Bước 3** — Thêm private helper method:

```java
private void sendStatusChangeNotification(UUID targetId, String type, String title, String content) {
    TrackingNotificationMessage message = TrackingNotificationMessage.builder()
            .targetId(targetId)
            .type(type)
            .title(title)
            .content(content)
            .build();
    kafkaTemplate.send(TOPIC, message);
    log.info("Sent {} notification to Kafka for target {}", type, targetId);
}
```

**Bước 4** — Thêm `sendStatusChangeNotification()` vào cuối mỗi method trước `return`:

Trong `acceptEmergencyRequest()` — thêm trước `return new AcceptEmergencyRequestResponse(...)` (line ~162):
```java
sendStatusChangeNotification(
    request.getTargetId(),
    TYPE_ACCEPTED,
    "Emergency Request Accepted",
    "Your emergency request has been accepted. Help is on the way."
);
```

Trong `rejectEmergencyRequest()` — thêm trước `return new RejectEmergencyRequestResponse(...)` (line ~206):
```java
sendStatusChangeNotification(
    request.getTargetId(),
    TYPE_REJECTED,
    "Emergency Request Rejected",
    "Your emergency request could not be handled at this time. Please contact another service."
);
```

Trong `closeEmergencyRequest()` — thêm trước `return new CloseEmergencyRequestResponse(...)` (line ~259):
```java
sendStatusChangeNotification(
    request.getTargetId(),
    TYPE_CLOSED,
    "Emergency Request Closed",
    "Your emergency request has been closed. We hope you are safe."
);
```

---

### 4b — Mobile: Thêm handler cho notification types mới

**File:** `frontend/TrackNest/hooks/usePushNotifications.ts`

Trong `responseListener` (lines 62–74), mở rộng switch để handle các types mới:

```typescript
// Trước (line 66–68)
if (data?.type === "EMERGENCY_REQUEST_ASSIGNED") {
  router.push("/(app)/sos");
  return;
}

// Sau — thêm các types mới
const emergencyTypes = [
  "EMERGENCY_REQUEST_ASSIGNED",
  "EMERGENCY_REQUEST_ACCEPTED",
  "EMERGENCY_REQUEST_REJECTED",
  "EMERGENCY_REQUEST_CLOSED",
];

if (data?.type && emergencyTypes.includes(data.type)) {
  router.push("/(app)/sos");
  return;
}
```

Tương tự, sửa đoạn `getLastNotificationResponseAsync()` (lines 79–91) theo cùng pattern.

---

### 4c — Web: Realtime location trong emergency dashboard

**File:** `frontend/track-nest-web/contexts/EmergencyRequestRealtimeContext.tsx`

**Bước 1** — Thêm state cho realtime location:

```typescript
// Thêm interface (sau interface hiện có hoặc ở đầu file)
interface RealtimeLocation {
  requestId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

// Thêm vào context type (export interface hoặc type của context)
realtimeLocation: RealtimeLocation | null;
```

**Bước 2** — Thêm subscription trong `useEffect` (sau subscription `/user/queue/emergency-request`):

```typescript
// Thêm sau stompClient.subscribe('/user/queue/emergency-request', ...)
stompClient.subscribe('/user/queue/user-location', (message) => {
  try {
    const locationMsg = JSON.parse(message.body);
    setRealtimeLocation({
      requestId: locationMsg.requestId ?? "",
      latitude: locationMsg.latitude,
      longitude: locationMsg.longitude,
      timestamp: locationMsg.timestamp ?? Date.now(),
    });
  } catch (err) {
    console.error("Failed to parse location message:", err);
  }
});
```

**Bước 3** — Expose `realtimeLocation` qua context value.

**File:** `frontend/track-nest-web/app/dashboard/emergency-requests/page.tsx`

- Đọc `realtimeLocation` từ context
- Khi `realtimeLocation` thay đổi và có request đang ACCEPTED: cập nhật tọa độ trên map

---

### 4d — Mobile: Background task handler cho emergency notification

**File:** `frontend/TrackNest/services/backgroundTasks.ts`

Trong `BACKGROUND_NOTIFICATION_TASK_NAME` handler (lines 127–145), thêm xử lý emergency types:

```typescript
// Thêm sau đoạn check chat_message (line 136)
const emergencyTypes = [
  "EMERGENCY_REQUEST_ASSIGNED",
  "EMERGENCY_REQUEST_ACCEPTED",
  "EMERGENCY_REQUEST_REJECTED",
  "EMERGENCY_REQUEST_CLOSED",
];

if (notifData?.type && emergencyTypes.includes(notifData.type)) {
  // Emergency FCM messages have notification field → OS auto-displays.
  // Store in AsyncStorage so the SOS screen can refresh on next open.
  try {
    await AsyncStorage.setItem("LAST_EMERGENCY_NOTIFICATION_TYPE", notifData.type);
    await AsyncStorage.setItem("LAST_EMERGENCY_NOTIFICATION_TIME", String(Date.now()));
  } catch (err) {
    console.error("[BackgroundNotification] failed to store emergency notification:", err);
  }
  return;
}
```

---

## Task 5

### Native Location Upload: gRPC trực tiếp từ Kotlin

---

### Tổng quan kiến trúc

**Hiện tại:**
```
NativeLocationService.kt  →  SharedPreferences (buffer)
                                ↓ (React Native đọc)
                         flushNativeLocationBufferToStorage()
                                ↓ (15 phút/lần)
                         uploadPendingLocations()
                                ↓
                         gRPC UpdateUserLocation
```

**Sau khi implement:**
```
NativeLocationService.kt  →  SharedPreferences (buffer, giữ nguyên)
         ↓ (ngay sau mỗi batch)
  LocationUploadClient.kt (new)
         ↓ (gRPC-Java, OkHttp)
  user-tracking: UpdateUserLocation (near-realtime: 5-60s)

Background task vẫn giữ nguyên (fallback khi native service không chạy)
```

---

### Các file cần thay đổi

| File | Thao tác | Lý do |
|------|---------|-------|
| `frontend/TrackNest/android/build.gradle` | Sửa | Thêm protobuf plugin |
| `frontend/TrackNest/android/app/build.gradle` | Sửa | Thêm gRPC-Java + OkHttp dependencies |
| `frontend/TrackNest/android/app/src/main/proto/tracker.proto` | Tạo mới | Copy từ `frontend/TrackNest/proto/tracker.proto` |
| `frontend/TrackNest/android/app/src/main/java/com/project/tracknest/LocationUploadClient.kt` | Tạo mới | gRPC client wrapper |
| `frontend/TrackNest/android/app/src/main/java/com/project/tracknest/NativeLocationService.kt` | Sửa | Trigger upload sau mỗi batch |
| `frontend/TrackNest/android/app/src/main/java/com/project/tracknest/NativeLocationModule.kt` | Sửa | Expose `setAuthToken`, `setGrpcUrl` |
| `frontend/TrackNest/utils/auth.ts` (hoặc file quản lý token) | Sửa | Sync token vào SharedPreferences |

---

### Chi tiết thay đổi

#### 5.1 `frontend/TrackNest/android/build.gradle` (project-level)

Thêm protobuf plugin vào `plugins {}` block:

```groovy
plugins {
    // ... existing plugins
    id "com.google.protobuf" version "0.9.4" apply false
}
```

#### 5.2 `frontend/TrackNest/android/app/build.gradle`

**Thêm plugin** (đầu file):
```groovy
apply plugin: "com.google.protobuf"
```

**Thêm vào `android {}` block** — sau `packagingOptions`:
```groovy
sourceSets {
    main {
        proto {
            srcDir 'src/main/proto'
        }
    }
}
```

**Thêm vào `dependencies {}`** (sau các implementation hiện có):
```groovy
// gRPC-Java + OkHttp transport
implementation "io.grpc:grpc-okhttp:1.62.2"
implementation "io.grpc:grpc-protobuf-lite:1.62.2"
implementation "io.grpc:grpc-stub:1.62.2"
implementation "javax.annotation:javax.annotation-api:1.3.2"

// Protobuf lite (Android-friendly)
implementation "com.google.protobuf:protobuf-javalite:3.25.3"
```

**Thêm `protobuf {}` block** (sau `dependencies {}`):
```groovy
protobuf {
    protoc {
        artifact = "com.google.protobuf:protoc:3.25.3"
    }
    plugins {
        grpc {
            artifact = "io.grpc:protoc-gen-grpc-java:1.62.2"
        }
    }
    generateProtoTasks {
        all().each { task ->
            task.builtins {
                java { option "lite" }
            }
            task.plugins {
                grpc { option "lite" }
            }
        }
    }
}
```

#### 5.3 `frontend/TrackNest/android/app/src/main/proto/tracker.proto`

Copy từ `frontend/TrackNest/proto/tracker.proto` với một thay đổi nhỏ: bỏ `import "google/rpc/status.proto"` và bỏ field `status` trong response (hoặc keep dependency bằng cách thêm thư mục `google/rpc/`).

Đơn giản nhất: tạo file proto tối giản chỉ với các message cần thiết:

```protobuf
syntax = "proto3";

option java_multiple_files = true;
option java_package = "project.tracknest.usertracking.proto.lib";
option java_outer_classname = "TrackerProto";
option java_lite_runtime = true;

service TrackerController {
  rpc UpdateUserLocation(UpdateUserLocationRequest)
      returns (UpdateUserLocationResponse);
}

message UserLocation {
  double latitude_deg = 1;
  double longitude_deg = 2;
  float accuracy_meter = 3;
  float velocity_mps = 4;
  uint64 timestamp_ms = 5;
}

message UpdateUserLocationRequest {
  repeated UserLocation locations = 1;
}

message UpdateUserLocationResponse {
  // Minimal - status field omitted to avoid google.rpc dependency
}
```

> **Lưu ý**: Nếu muốn giữ `google.rpc.Status`, cần thêm thư mục `src/main/proto/google/rpc/` với file `status.proto`. Phiên bản rút gọn trên đủ để hoạt động.

#### 5.4 `LocationUploadClient.kt` (file mới)

```kotlin
package com.project.tracknest

import android.content.Context
import io.grpc.ManagedChannel
import io.grpc.ManagedChannelBuilder
import io.grpc.Metadata
import io.grpc.stub.MetadataUtils
import project.tracknest.usertracking.proto.lib.TrackerControllerGrpc
import project.tracknest.usertracking.proto.lib.UpdateUserLocationRequest
import project.tracknest.usertracking.proto.lib.UserLocation
import java.util.concurrent.TimeUnit

object LocationUploadClient {

    private const val PREFS_NAME = "tracknest_native_location"
    private const val TOKEN_KEY = "jwt_token"
    private const val GRPC_HOST_KEY = "grpc_host"
    private const val GRPC_PORT_KEY = "grpc_port"
    private const val DEFAULT_HOST = "10.0.2.2"   // Android emulator → localhost
    private const val DEFAULT_PORT = 8800          // Envoy gRPC-Web port

    @Volatile
    private var channel: ManagedChannel? = null

    fun upload(context: Context, locations: List<LocationEntry>) {
        if (locations.isEmpty()) return

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val token = prefs.getString(TOKEN_KEY, null) ?: return
        val host = prefs.getString(GRPC_HOST_KEY, DEFAULT_HOST) ?: DEFAULT_HOST
        val port = prefs.getInt(GRPC_PORT_KEY, DEFAULT_PORT)

        try {
            val ch = getOrCreateChannel(host, port)
            val authHeader = Metadata.Key.of("Authorization", Metadata.ASCII_STRING_MARSHALLER)
            val metadata = Metadata().apply { put(authHeader, "Bearer $token") }

            val stub = MetadataUtils.attachHeaders(
                TrackerControllerGrpc.newBlockingStub(ch).withDeadlineAfter(10, TimeUnit.SECONDS),
                metadata
            )

            val userLocations = locations.map { entry ->
                UserLocation.newBuilder()
                    .setLatitudeDeg(entry.latitude)
                    .setLongitudeDeg(entry.longitude)
                    .setAccuracyMeter(entry.accuracy.toFloat())
                    .setVelocityMps(entry.speed.toFloat())
                    .setTimestampMs(entry.timestamp)
                    .build()
            }

            val request = UpdateUserLocationRequest.newBuilder()
                .addAllLocations(userLocations)
                .build()

            stub.updateUserLocation(request)
        } catch (e: Exception) {
            // Network failures are silently ignored — background task is the fallback
            android.util.Log.w("LocationUpload", "gRPC upload failed: ${e.message}")
        }
    }

    private fun getOrCreateChannel(host: String, port: Int): ManagedChannel {
        return channel ?: synchronized(this) {
            channel ?: ManagedChannelBuilder
                .forAddress(host, port)
                .usePlaintext()              // Envoy handles TLS termination
                .build()
                .also { channel = it }
        }
    }

    fun resetChannel() {
        synchronized(this) {
            channel?.shutdownNow()
            channel = null
        }
    }

    data class LocationEntry(
        val latitude: Double,
        val longitude: Double,
        val accuracy: Double,
        val speed: Double,
        val timestamp: Long,
    )
}
```

#### 5.5 `NativeLocationService.kt` — Thêm trigger upload

Trong `locationCallback.onLocationResult()`, sau đoạn ghi vào buffer (sau `prefs.edit().putString(BUFFER_KEY, buffer.toString()).apply()`), thêm:

```kotlin
// Trigger async gRPC upload for collected locations
val entries = locations.map { loc ->
    LocationUploadClient.LocationEntry(
        latitude = loc.latitude,
        longitude = loc.longitude,
        accuracy = loc.accuracy.toDouble(),
        speed = loc.speed.toDouble(),
        timestamp = loc.time,
    )
}
Thread {
    LocationUploadClient.upload(applicationContext, entries)
}.start()
```

> Dùng `Thread` thay vì coroutine để tránh thêm dependency kotlinx-coroutines vào native module nếu chưa có. Có thể dùng `lifecycleScope.launch` nếu Service đã kế thừa `LifecycleService`.

#### 5.6 `NativeLocationModule.kt` — Expose setAuthToken, setGrpcUrl

Thêm 2 `@ReactMethod` mới:

```kotlin
@ReactMethod
fun setAuthToken(token: String) {
    val prefs = reactContext.getSharedPreferences("tracknest_native_location", Context.MODE_PRIVATE)
    prefs.edit().putString("jwt_token", token).apply()
    // Reset channel so next upload picks up new credentials
    LocationUploadClient.resetChannel()
}

@ReactMethod
fun setGrpcUrl(host: String, port: Int) {
    val prefs = reactContext.getSharedPreferences("tracknest_native_location", Context.MODE_PRIVATE)
    prefs.edit()
        .putString("grpc_host", host)
        .putInt("grpc_port", port)
        .apply()
    LocationUploadClient.resetChannel()
}
```

#### 5.7 React Native — Sync token vào SharedPreferences

Tìm nơi token được lưu/làm mới trong React Native (thường trong `AuthContext.tsx` hoặc file auth utility), thêm call:

```typescript
import { NativeModules } from "react-native";

// Khi token được lấy hoặc refresh thành công:
const { NativeLocationModule } = NativeModules;
if (NativeLocationModule?.setAuthToken) {
  NativeLocationModule.setAuthToken(accessToken);
}

// Khi biết URL gRPC (từ config/env):
if (NativeLocationModule?.setGrpcUrl) {
  NativeLocationModule.setGrpcUrl(grpcHost, grpcPort);
}
```

File cụ thể cần xác định bằng cách tìm nơi `authService.getAccessToken()` hoặc `AsyncStorage.setItem("access_token", ...)` được gọi sau khi login/refresh thành công.

---

### Chiến lược upload 2 tầng sau khi implement

| Tầng | Cơ chế | Kích hoạt | Fallback cho |
|------|--------|----------|-------------|
| **Tầng 1 (mới)** | `LocationUploadClient.kt` gRPC direct | Sau mỗi batch GPS (5–60s) | Realtime tracking |
| **Tầng 2 (giữ nguyên)** | `expo-background-task` + `uploadPendingLocations()` | Mỗi 15 phút | Khi tầng 1 fail (mạng yếu, token hết hạn) |

- Tầng 1 upload thành công → buffer vẫn được ghi (để tầng 2 kiểm tra), nhưng tầng 2 sẽ thấy buffer rỗng (hoặc cần thêm logic xóa buffer sau khi tầng 1 upload thành công)
- Để tránh double-upload: Sau khi tầng 1 upload thành công, xóa buffer trong SharedPreferences: `prefs.edit().putString(BUFFER_KEY, "[]").apply()` bên trong `LocationUploadClient.upload()` khi thành công.

---

### Lưu ý quan trọng trước khi implement Task 5

1. **gRPC-Web vs gRPC-Java**: Mobile React Native hiện dùng `grpc-web` (qua Envoy). Kotlin native sẽ dùng `grpc-java` (OkHttp) kết nối trực tiếp đến Envoy port 8800 hoặc gRPC port 19090. Cần xác nhận Envoy có accept gRPC binary (không phải gRPC-Web) từ Android không, hoặc kết nối thẳng đến port 19090 của `user-tracking` (plaintext).
2. **Token format**: gRPC metadata header `Authorization: Bearer <token>` cần match với cách `GrpcSecurityInterceptor` ở backend đọc token.
3. **Emulator vs device**: `DEFAULT_HOST = "10.0.2.2"` chỉ đúng với Android emulator → localhost. Với thiết bị thật, cần IP thực của server hoặc đọc từ config.
4. **ProGuard**: Nếu build release bật minify, cần thêm ProGuard rules cho gRPC và protobuf.
5. **Thread safety**: `LocationUploadClient.channel` là singleton — cần `@Volatile` + `synchronized` khi khởi tạo (đã có trong code trên).

---

## Thứ tự triển khai khuyến nghị

```
Task 2  (dễ nhất, ít rủi ro, chỉ UI mobile)
  ↓
Task 1  (UI mobile + đổi endpoint)
  ↓
Task 4d (background task mobile — low risk)
  ↓
Task 4a (backend Java — cần test Kafka)
  ↓
Task 4b (mobile hook — phụ thuộc 4a)
  ↓
Task 4c (web context + UI)
  ↓
Task 5  (phức tạp nhất — native Android + build system)
```

---

## Checklist kiểm thử sau khi implement

### Task 1
- [ ] Tạo missing person report từ mobile có ảnh → backend lưu trong MinIO (không qua MinIO client trực tiếp)
- [ ] Report có trường ngoại hình → web hiển thị đúng trong content HTML
- [ ] Tạo report không có ảnh → không lỗi

### Task 2
- [ ] Tạo crime report với `numberOfVictims = 2`, `arrested = true` → backend lưu đúng
- [ ] Ngày trong response là `YYYY-MM-DD`, không bị `DateTimeParseException`

### Task 3 (xác minh đã pass)
- [ ] Gửi tin → app foreground khác tab → notification hiện
- [ ] Gửi tin → app background → FCM hiển thị
- [ ] Gửi tin của chính mình → không có notification

### Task 4
- [ ] Emergency request accepted → target user nhận FCM notification
- [ ] Emergency request rejected → target user nhận FCM notification
- [ ] Emergency request closed → target user nhận FCM notification
- [ ] Family members nhận notification tương ứng với target user
- [ ] Web dashboard hiển thị realtime vị trí target user khi đang ACCEPTED
- [ ] Tap notification emergency khi app background → navigate đến SOS screen

### Task 5
- [ ] Build Android thành công với gRPC-Java
- [ ] Native service upload location mỗi ~60s (Normal mode)
- [ ] Trên map family circle: vị trí cập nhật gần realtime (không đợi 15 phút)
- [ ] Khi mất mạng: không crash, upload tự động retry khi có mạng
- [ ] Token refresh → `setAuthToken` được gọi → upload tiếp tục
