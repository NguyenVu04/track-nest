# Fix Plan: Web Emergency Features (Phần 3 Demo)

Dựa trên audit `WEB_EMERGENCY_AUDIT.md`, có 3 vấn đề cần fix để demo Phần 3 hoạt động đầy đủ.

---

## Issue 1 — Nút "Broadcast Loc" không có handler

**Vấn đề:** Nút "Broadcast Loc" trong Quick Actions là placeholder rỗng, không có
`onClick`, không có geolocation wiring. Emergency Service không thể cập nhật vị trí
qua web UI → PostGIS chọn sai service khi có SOS.

**Fix:**
- File: `app/dashboard/emergency-requests/page.tsx`
- Thêm state `isBroadcasting: boolean`
- Thêm `handleBroadcastLocation()`: `navigator.geolocation` → `updateEmergencyServiceLocation()` → toast
- Wire button: `onClick`, `disabled`, spinner icon khi đang broadcast

**Commit:** `fix(web): wire Broadcast Loc button to update emergency service location`

---

## Issue 2 — Trang detail `/[id]` không có live map

**Vấn đề:** `app/dashboard/emergency-requests/[id]/page.tsx` load data từ `sessionStorage`
(tọa độ tĩnh lúc mở request). Không dùng `useEmergencyRequestRealtime()` nên map không
cập nhật khi nạn nhân di chuyển.

**Fix:**
- File: `app/dashboard/emergency-requests/[id]/page.tsx`
- Import `useEmergencyRequestRealtime` (đã có trong provider tree của dashboard layout)
- Tính `isLive`: status PENDING/ACCEPTED + `realtimeLocation.userId === request.targetId`
- Override marker position bằng live coords khi `isLive`
- Thêm badge **"● LIVE"** khi đang live

**Commit:** `fix(web): show real-time location on emergency request detail map`

---

## Issue 3 — Reporter không có trang "My Requests"

**Vấn đề:** `getUserEmergencyRequests()` đã có trong service nhưng không được gọi ở đâu.
Reporter chỉ thấy bell badge khi STOMP báo ACCEPTED/CLOSED, không có trang để xem
danh sách và trạng thái request của mình.

**Fix:**
- File mới: `app/dashboard/emergency-requests/my/page.tsx` — danh sách requests của Reporter, watch `refresh` từ context để tự refetch khi có STOMP update
- File: `components/layout/Sidebar.tsx` — thêm nav item "My Emergency Requests" cho Reporter
- File: `app/dashboard/DashboardClientContent.tsx` — thêm route `/dashboard/emergency-requests/my` → `["Reporter"]`
- File: `messages/en.json` + `messages/vi.json` — thêm nav translation key

**Commit:** `feat(web): add My Emergency Requests page for Reporter role`

---

## Thứ tự thực hiện

- [x] Viết plan file này
- [ ] Fix Issue 1 → commit
- [ ] Fix Issue 2 → commit
- [ ] Fix Issue 3 → commit
