# Phân Tích Test Cases — TrackNest Web Frontend

> Tài liệu này mô tả toàn bộ test suite của ứng dụng `frontend/track-nest-web` (Next.js 16 + React 19).  
> Bao gồm: những gì được kiểm thử, luồng test, giá trị đầu vào/đầu ra, và phương pháp thiết kế test.

---

## Mục Lục

1. [Tổng Quan Kiến Trúc Test](#1-tổng-quan-kiến-trúc-test)
2. [Công Nghệ & Chiến Lược Mock](#2-công-nghệ--chiến-lược-mock)
3. [Jest Integration Tests (`test/`)](#3-jest-integration-tests-test)
   - [login.test.tsx](#31-logintesttsx)
   - [page.test.tsx — Landing Page](#32-pagetesttsx--landing-page)
   - [app-layout.test.tsx](#33-app-layouttesttsx)
   - [dashboard-layout.test.tsx](#34-dashboard-layouttesttsx)
   - [dashboard-page.test.tsx](#35-dashboard-pagetesttsx)
   - [profile.test.tsx](#36-profiletesttsx)
   - [providers.test.tsx](#37-providerstesttsx)
   - [crime-reports-pages.test.tsx](#38-crime-reports-pagestesttsx)
   - [missing-persons-pages.test.tsx](#39-missing-persons-pagestesttsx)
   - [guidelines-pages.test.tsx](#310-guidelines-pagestesttsx)
   - [emergency-requests-pages.test.tsx](#311-emergency-requests-pagestesttsx)
   - [admin-emergency-requests-pages.test.tsx](#312-admin-emergency-requests-pagestesttsx)
   - [accounts.test.tsx](#313-accountstesttsx)
   - [safe-zones-page.test.tsx](#314-safe-zones-pagetesttsx)
4. [Context/Hook Unit Tests](#4-contexthook-unit-tests)
   - [EmergencyRequestRealtimeContext.test.tsx](#41-emergencyrequestreal-timecontexttesttsx)
5. [Advanced Integration Tests (`__tests__/`)](#5-advanced-integration-tests-__tests__)
   - [EmergencyRequestsPage.test.tsx](#51-emergencyrequestspagetesttsx)
   - [SafeZonesPage.test.tsx](#52-safezonespagetesttsx)
6. [Thống Kê Tổng Hợp](#6-thống-kê-tổng-hợp)

---

## 1. Tổng Quan Kiến Trúc Test

Bộ test được tổ chức theo **hai tầng** kiểm thử:

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 2 — Advanced Integration (Jest + userEvent)           │
│  Kiểm thử use case cụ thể với async interaction thật         │
│  __tests__/app/  (2 file, ~12 test case)                     │
├─────────────────────────────────────────────────────────────┤
│  Layer 1 — Integration (Jest + RTL)                          │
│  Kiểm thử component + service mocked                         │
│  test/           (14 file, ~300+ test case)                  │
│  contexts/__tests__/ (1 file, ~5 test case)                  │
└─────────────────────────────────────────────────────────────┘
```

**Đặc điểm nổi bật:** Không có pure unit test — mọi Jest test đều ở mức integration, render component thật và mock ở tầng service/context.

---

## 2. Công Nghệ & Chiến Lược Mock

### Framework

| Công cụ | Mục đích |
|---|---|
| Jest | Test runner, assertion, spy/mock |
| React Testing Library | Render component, query DOM |
| @testing-library/user-event | Mô phỏng tương tác người dùng async |
| @testing-library/jest-dom | Custom matchers (`toBeDisabled`, `toHaveValue`, ...) |

### Chiến Lược Mock (Jest)

**1. Service Layer** — Mock toàn bộ module service:
```typescript
jest.mock("@/services/emergencyOpsService", () => ({
  emergencyOpsService: {
    getEmergencyRequests: jest.fn().mockResolvedValue(mockList),
    acceptEmergencyRequest: jest.fn().mockResolvedValue({}),
  }
}));
```

**2. Context** — Mock hook trả về user/state cố định:
```typescript
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, isAuthenticated: true })
}));
```

**3. Next.js Navigation** — Mock router, pathname, params:
```typescript
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
  usePathname: () => mockPathname,
  useParams: () => ({ id: "item-1" }),
}));
```

**4. Component Mocking** — Mock UI library components nặng (Radix, shadcn, Leaflet) để tránh portal issue và dependency phức tạp.

**5. Hoisted Variables** — Dùng `var` thay vì `const` trong `jest.mock` factory để mock có thể thay đổi giá trị giữa các test.

---

## 3. Jest Integration Tests (`test/`)

### 3.1 `login.test.tsx`

**Mô tả:** Kiểm thử trang Login và luồng khởi tạo Keycloak.

**Phương pháp thiết kế:** Use Case Testing + State-Based Testing (trạng thái Keycloak: loading → unauthenticated / authenticated).

**Mocks:**
- `@/services/authService` — `initKeycloak`, `loginWithKeycloak`
- `@/contexts/AuthContext` — `isAuthenticated`
- `next/navigation` — `useRouter`
- `LottieLoader` component

**Dữ liệu đầu vào & kết quả:**

| Test Case | Trạng thái đầu vào | Kết quả mong đợi |
|---|---|---|
| Renders without crashing | N/A | `document.body` tồn tại |
| Loading spinner | `initKeycloak` chưa resolve | `LottieLoader` visible, text "initialisingSession" |
| Unauthenticated state | `initKeycloak` resolve → unauthenticated | App name, tagline, 3 feature pills, "securedBy" visible |
| Sign-in button rendered | Unauthenticated | Nút "signIn" visible |
| Redirect khi đã auth (via context) | `isAuthenticated = true` | `router.push("/dashboard/missing-persons")` |
| Redirect khi Keycloak trả về authenticated | `initKeycloak` → authenticated | `router.push("/dashboard/missing-persons")` |
| Click Sign-In | Nút "signIn" clicked | `loginWithKeycloak()` được gọi 1 lần |
| Lỗi redirect | `loginWithKeycloak` throws | `toast.error()` được gọi |

**Luồng test chính:**
```
render LoginContent
  → initKeycloak() pending → hiển thị loading
  → initKeycloak() resolve (unauthenticated) → hiển thị login UI
  → user click Sign In → loginWithKeycloak() gọi
  → nếu đã auth → push("/dashboard/missing-persons")
```

**Tóm tắt suite:** Bao phủ đầy đủ 3 trạng thái của luồng xác thực Keycloak (loading, unauthenticated, authenticated), bao gồm cả happy path và error path. Đây là test quan trọng nhất cho entry point của ứng dụng.

---

### 3.2 `page.test.tsx` — Landing Page

**Mô tả:** Kiểm thử trang public landing page với đầy đủ các section.

**Phương pháp thiết kế:** Structural Testing (kiểm tra từng section) + State-Based Testing (navbar scroll behavior).

**Mocks:**
- `@/contexts/AuthContext`
- `framer-motion` — mock phức tạp strip animation props
- `next/link` — mock thành anchor tag thông thường

**Dữ liệu đầu vào & kết quả:**

| Section | Test Case | Đầu vào | Kết quả mong đợi |
|---|---|---|---|
| Navbar | Logo, nav links | N/A | "TrackNest", "Features", "Safety", "Platform", "About" visible |
| Scroll behavior | Scroll event | `window.scrollY = 0` → `50` | Background class thay đổi sau threshold 20px |
| Mobile menu | Hamburger click | Click menu button | Nav links hiện ra; click lần 2 → ẩn đi |
| Hero | Headings & CTAs | N/A | 2 CTA buttons, phone mockup visible |
| Features | 3 feature cards | N/A | "Live Location", "Emergency Requests", "Family Circles" |
| Stats Bar | 4 stat values | N/A | "Realtime", "Multi-App", "Live", "Verified" |
| Footer | Copyright | N/A | "2026", 3 columns với links |

**Tóm tắt suite:** Kiểm thử toàn bộ nội dung tĩnh của landing page và hành vi tương tác đơn giản (mobile menu toggle, scroll-triggered navbar). Test phức tạp nhất là mock `framer-motion` để strip animation props trong khi vẫn giữ cấu trúc DOM.

---

### 3.3 `app-layout.test.tsx`

**Mô tả:** Kiểm thử root layout của ứng dụng Next.js.

**Phương pháp thiết kế:** Smoke Testing (xác nhận layout render không crash và truyền props đúng).

**Tóm tắt suite:** Test đơn giản xác nhận root layout render children, truyền đúng `lang` attribute, và không thêm markup ngoài ý muốn.

---

### 3.4 `dashboard-layout.test.tsx`

**Mô tả:** Kiểm thử protected layout của dashboard — auth guard, RBAC, sidebar, và logout.

**Phương pháp thiết kế:** Decision Table Testing (role × route) + State-Based Testing (auth states) + Use Case Testing.

**Mocks:**
- `@/contexts/AuthContext` — `useAuth` với nhiều state
- `next/navigation` — `useRouter`, `usePathname`
- Components: `Loading`, `Header`, `AppSidebar`, `SidebarProvider`

**Bảng quyết định — Role × Route:**

| Role | Pathname | Kết quả |
|---|---|---|
| Reporter | `/dashboard/accounts` | `replace("/dashboard")` — blocked |
| Reporter | `/dashboard/missing-persons` | Không redirect — allowed |
| Reporter | `/dashboard/emergency-requests` | `replace("/dashboard")` — blocked |
| Emergency Service | `/dashboard/emergency-requests` | Không redirect — allowed |
| (any) | `/dashboard` | Không redirect — base path |

**Trạng thái đầu vào & kết quả:**

| Trạng thái | Kết quả mong đợi |
|---|---|
| `isLoading: true` | `Loading` component fullscreen visible, children ẩn |
| `isAuthenticated: false` | `container.firstChild === null`, `push("/login")` |
| `isAuthenticated: true` | Sidebar, Header, children rendered |
| Click Logout | `logout()` gọi → `push("/login")` |

**Luồng test RBAC:**
```
render DashboardLayout với user Role + pathname
  → useEffect chạy → kiểm tra RBAC
  → nếu không có quyền → router.replace("/dashboard")
  → nếu có quyền → render children bình thường
```

**Tóm tắt suite:** Suite quan trọng nhất về bảo mật — bao phủ toàn bộ auth guard (loading/unauthenticated/authenticated), RBAC routing (role-based redirect), và logout flow. Decision table được áp dụng có hệ thống để test mọi tổ hợp role × route.

---

### 3.5 `dashboard-page.test.tsx`

**Mô tả:** Kiểm thử trang home của dashboard.

**Phương pháp thiết kế:** Smoke Testing + Content Verification.

**Tóm tắt suite:** Xác nhận trang dashboard home render đúng greeting và summary cards mà không crash.

---

### 3.6 `profile.test.tsx`

**Mô tả:** Kiểm thử trang Profile người dùng — xem và cập nhật thông tin, đổi mật khẩu.

**Phương pháp thiết kế:** Use Case Testing + Equivalence Class Partitioning (password match/mismatch) + Boundary Testing (fake timers).

**Mocks:**
- `@/contexts/AuthContext` — `useAuth` với user đầy đủ thông tin

**Dữ liệu đầu vào & kết quả:**

| Test Case | Đầu vào | Kết quả |
|---|---|---|
| Null user guard | `user = null` | `container.firstChild === null` |
| Render form fields | `user = { username, email, fullName, role }` | Tất cả inputs visible với đúng giá trị |
| Disabled fields | N/A | `username`, `role` inputs disabled |
| Update profile success | Click "Update Profile" | Text "Profile updated successfully!" xuất hiện |
| Success message auto-clear | 3 giây trôi qua (fake timers) | Message biến mất |
| Edit fullName | Gõ vào input | Input value thay đổi |
| Password match | `newPassword === confirmPassword` | "Password updated successfully!", fields cleared |
| Password mismatch (ECP: invalid class) | `newPassword !== confirmPassword` | `window.alert("Passwords do not match!")` |

**Tóm tắt suite:** Kiểm thử đầy đủ 2 form trên profile page. Điểm đáng chú ý là dùng `jest.useFakeTimers()` để test auto-clear của success message sau 3 giây mà không cần `setTimeout` thực.

---

### 3.7 `providers.test.tsx`

**Mô tả:** Kiểm thử Providers wrapper component.

**Phương pháp thiết kế:** Structural Testing — xác nhận wrapper không thêm DOM ngoài ý muốn.

**Tóm tắt suite:** 3 test case đơn giản xác nhận `Providers` render children đúng, render nhiều children, và không thêm wrapper div thừa.

---

### 3.8 `crime-reports-pages.test.tsx`

**Mô tả:** Kiểm thử 4 trang Crime Reports: List, Detail, Create, Edit.

**Phương pháp thiết kế:** Use Case Testing (4 CRUD pages) + State-Based Testing (loading/loaded/error) + Error Path Testing.

**Mocks:**
- `@/services/criminalReportsService` — 6 methods
- `use-debounce` — `useDebouncedCallback`
- Components: `CrimeReportList`, `CrimeReportDetail`, `CrimeReportForm`, `CrimeHeatmapView`, `Loading`, `Breadcrumbs`

**Dữ liệu đầu vào:**
```typescript
mockReport = {
  id: "report-1", title: "Test Crime Report",
  severity: 3, date: "2024-01-01",
  longitude: 106.0, latitude: 10.0,
  numberOfVictims: 1, numberOfOffenders: 1,
  isPublic: false, photos: [], reporterId: "u1",
}
```

**Luồng test — List Page:**
```
render → null guard check
  → Loading visible (promise pending)
  → listCrimeReports resolves → CrimeReportList rendered
  → click "View Detail" → router.push("/dashboard/crime-reports/report-1")
  → click "Heatmap" → CrimeHeatmapView shown
  → click "Back" → return to list
  → trigger publish → publishCrimeReport() called
  → listCrimeReports rejects → toast.error()
```

**Kết quả mong đợi theo trạng thái:**

| Trạng thái | Đầu ra |
|---|---|
| `user = null` | `container.firstChild === null` |
| API loading | `Loading` component visible |
| API success | List component rendered với data |
| Click "View" | `router.push("/dashboard/crime-reports/report-1")` |
| Click "Publish" | `publishCrimeReport("report-1")` gọi |
| API error | `toast.error()` gọi |
| `getCrimeReport` fails (Detail/Edit) | Text "Not Found" visible |

**Tóm tắt suite:** Suite lớn nhất trong nhóm `test/` với 4 sub-pages và hơn 20 test cases. Bao phủ toàn bộ CRUD lifecycle của crime reports với cả happy path, loading state, error handling, và navigation flow. Đặc biệt test cả chức năng chuyển đổi giữa list view và heatmap view.

---

### 3.9 `missing-persons-pages.test.tsx`

**Mô tả:** Kiểm thử 4 trang Missing Persons: List, Detail, Create, Edit.

**Phương pháp thiết kế:** Use Case Testing + State-Based Testing — cấu trúc tương tự crime-reports nhưng với domain Missing Persons.

**Mocks:**
- `@/services/criminalReportsService` — 6 methods cho missing persons
- `@/contexts/NotificationContext` — `addNotification`
- Components: `MissingPersonList`, `MissingPersonDetail`, `MissingPersonForm`, `Loading`, `Breadcrumbs`

**Dữ liệu đầu vào:**
```typescript
mockPerson = {
  id: "person-1", fullName: "John Doe",
  personalId: "ID123", photo: "photo.jpg",
  date: "2024-01-01", contentDocId: "doc-1",
  userId: "u2", reporterId: "u1",
  isPublic: false, latitude: 10.0, longitude: 106.0,
}
```

**Điểm khác biệt so với crime-reports:**
- Publish action gọi cả `publishMissingPersonReport()` VÀ `addNotification()` — test verify cả hai
- Delete từ Detail page navigate back về list
- Edit page navigate về detail page (không phải list)

**Kết quả mong đợi theo action:**

| Action | Expected |
|---|---|
| Click Publish | `publishMissingPersonReport("person-1")` + `addNotification({...})` |
| Click Delete | `deleteMissingPersonReport("person-1")` + `addNotification({...})` |
| Save (Create) | `router.push("/dashboard/missing-persons")` |
| Save (Edit) | `router.push("/dashboard/missing-persons/person-1")` |
| Back button | `router.back()` |

**Tóm tắt suite:** Cấu trúc tương tự crime-reports, điểm đặc biệt là test sự tích hợp của `NotificationContext` — mỗi action quan trọng đều phải trigger notification. Suite xác nhận rằng hai luồng navigation sau save (create → list, edit → detail) hoạt động đúng.

---

### 3.10 `guidelines-pages.test.tsx`

**Mô tả:** Kiểm thử trang Safety Guidelines với tab filtering, rich text editor, và dual-button pattern cho draft/published.

**Phương pháp thiết kế:** Use Case Testing + Decision Table (tab × API params) + State-Based Testing (draft vs published).

**Mocks:**
- `@/services/criminalReportsService` — 6 guideline methods
- Components: `ConfirmModal`, `ChatbotPanel`, `Loading`, `RichTextEditor`, `Breadcrumbs`

**Dữ liệu đầu vào:**
```typescript
mockDraftGuideline = {
  id: "guide-1", title: "Safety Guidelines",
  abstractText: "Important safety info",
  content: "<p>Content here</p>",
  contentDocId: "doc-1", isPublic: false,
}
mockPublishedGuideline = { ...mockDraftGuideline, isPublic: true }
```

**Bảng quyết định — Tab × API Call:**

| Tab clicked | `isPublic` param | Button set |
|---|---|---|
| "All Guides" | `undefined` | Context-dependent |
| "Published" | `true` | "View" + "Edit" |
| "Drafts" | `false` | "Continue" |

**Bảng quyết định — Content Type:**

| `content` value | Render method |
|---|---|
| Bắt đầu bằng `<` (HTML) | Render text trực tiếp |
| Là URL | Render `<iframe>` |

**Test Cases quan trọng:**

| Suite | Test Case | Đầu vào | Kết quả |
|---|---|---|---|
| Tabs | Click "Published" | `isPublic: true` | API gọi với `{ isPublic: true }` |
| Tabs | Click "Drafts" | `isPublic: false` | API gọi với `{ isPublic: false }` |
| Cards | Draft guideline | `isPublic: false` | "Draft" badge + "Continue" button |
| Cards | Published guideline | `isPublic: true` | "Published" badge + "View" + "Edit" |
| Delete | Click Delete → Confirm | `id: "guide-1"` | `deleteGuidelinesDocument("guide-1")` |
| Create | Click "Save as Draft" | Điền title | `createGuidelinesDocument` gọi, `publishGuidelinesDocument` KHÔNG gọi |
| Create | Cancel | N/A | `router.back()` gọi |

**Tóm tắt suite:** Suite phức tạp nhất về UI state — phải track đồng thời tab state, publish state (draft/published), và pagination. Điểm đáng chú ý là test xác nhận "Save as Draft" KHÔNG gọi publish API, đây là negative test case quan trọng.

---

### 3.11 `emergency-requests-pages.test.tsx`

**Mô tả:** Kiểm thử trang Emergency Requests cho Emergency Service role — list, accept, reject, detail.

**Phương pháp thiết kế:** Decision Table (status × actions) + Use Case Testing + Modal Flow Testing.

**Mocks:**
- `@/services/emergencyOpsService` — 4 methods
- `@/contexts/EmergencyRequestRealtimeContext` — real-time hook
- Components: `MapView`, `Loading`, `Breadcrumbs`, DropdownMenu (flat render)

**Dữ liệu đầu vào:**
```typescript
mockRequest = {
  id: "req-1", status: "PENDING",
  senderFirstName: "Alice", senderLastName: "Smith",
  targetFirstName: "Bob", targetLastName: "Jones",
  targetLastLatitude: 10.8231, targetLastLongitude: 106.6297,
}
emergencyUser = { id: "u1", role: ["Emergency Service"] }
reporterUser  = { id: "u2", role: ["Reporter"] }
```

**Bảng quyết định — Role × Access:**

| Role | Quyền truy cập |
|---|---|
| Emergency Service | Full access |
| Reporter | "accessDenied" hiển thị |
| Admin | "accessDenied" hiển thị |
| `user = null` | `container.firstChild === null` |

**Luồng test Reject Modal:**
```
render với PENDING request
  → Click "Reject" button
  → Modal mở, rejectModalTitle visible
  → Click "Cancel" → Modal đóng
  → Click "Reject" lại → Modal mở
  → Nhập reason → Click "Confirm"
  → rejectEmergencyRequest("req-1", reason) gọi
```

**Test Cases quan trọng:**

| Test Case | Đầu vào | Kết quả |
|---|---|---|
| PENDING shows accept/reject | `status: "PENDING"` | Cả hai nút visible |
| Click Accept | Click Accept button | `acceptEmergencyRequest("req-1")` |
| Click Reject → Cancel | Click → Modal → Cancel | Modal đóng, không gọi API |
| Click Reject → Confirm | Nhập reason → Confirm | `rejectEmergencyRequest("req-1", reason)` |
| Row click navigation | Click row | `router.push("/dashboard/emergency-requests/req-1")` |
| sessionStorage on nav | Click row | `sessionStorage["emergency-request-detail:req-1"]` được set |
| Detail: no sessionStorage | Navigate trực tiếp | "Request not found." hiển thị |

**Tóm tắt suite:** Bao phủ đầy đủ lifecycle của emergency request từ phía Emergency Service: xem list, accept, reject (với modal confirmation và reason input), navigate to detail. Đặc biệt test pattern sessionStorage để truyền data sang detail page.

---

### 3.12 `admin-emergency-requests-pages.test.tsx`

**Mô tả:** Kiểm thử trang Emergency Requests cho Admin role — read-only view với filter và search.

**Phương pháp thiết kế:** Decision Table (role × access) + State-Based Testing + Negative Testing (read-only).

**Dữ liệu đầu vào:**
```typescript
mockAdminRequest = {
  id: "req-1", status: "PENDING",
  senderFirstName: "Alice", senderLastName: "Smith",
  targetFirstName: "Bob", targetLastName: "Jones",
  targetLastLatitude: 10.8231, targetLastLongitude: 106.6297,
  serviceUsername: "service_unit_1",
}
```

**Test Cases quan trọng:**

| Test Case | Đầu vào | Kết quả |
|---|---|---|
| Admin-only access | `role: ["Admin"]` | Full render |
| Non-admin blocked | `role: ["Reporter"]` | "accessDenied" text |
| Read-only view | Admin viewing PENDING | Accept/Reject buttons **không** hiển thị |
| Client-side search | Type "nonexistent-id" | Alice Smith row biến mất |
| Status filter | Select "PENDING" | API gọi với `("PENDING", 0, 50)` |
| Row navigation | Click row | `router.push` với `?from=admin` |
| sessionStorage on nav | Click row | `sessionStorage["emergency-request-detail:req-1"]` set |
| Empty state | API trả `[]` | "No emergency alerts found." |

**Tóm tắt suite:** Phân biệt rõ Admin view (read-only) vs Emergency Service view (actionable). Điểm đáng chú ý là negative test "does NOT render Accept/Reject buttons" — xác nhận Admin không thể thực hiện actions, chỉ quan sát. Filter có cả client-side search và server-side status filter.

---

### 3.13 `accounts.test.tsx`

**Mô tả:** Kiểm thử trang Account Management — list accounts và detail view.

**Phương pháp thiết kế:** Use Case Testing + Smoke Testing.

**Test Cases:**

| Test Case | Đầu vào | Kết quả |
|---|---|---|
| Null user guard | `user = null` | "Access Denied" visible |
| Render heading | Auth user | "Account Management" visible |
| Initial count | Empty state | "0 total accounts" |
| Search input | Type "john" | Input value = "john" |
| Detail not found | Empty list + detail route | "Account Not Found" visible |
| Navigate from denied | Click button | `router.push("/dashboard")` |

**Tóm tắt suite:** Suite đơn giản kiểm thử account management page với guard pattern và basic rendering. Detail page test chủ yếu là stub implementation — chưa có full integration với account service.

---

### 3.14 `safe-zones-page.test.tsx`

**Mô tả:** Kiểm thử trang Safe Zone Management — CRUD safe zones với map integration.

**Phương pháp thiết kế:** Use Case Testing + Modal Flow Testing + State-Based Testing.

**Mocks:**
- `@/services/emergencyOpsService` — `getSafeZones`, `createSafeZone`, `deleteSafeZone`
- `MapView` — mock với stub "Simulate Map Click" button
- Components: `ConfirmModal`, `Loading`, `Breadcrumbs`

**Dữ liệu đầu vào:**
```typescript
mockZone = {
  id: "zone-1", name: "Police Station A",
  latitude: 10.8231, longitude: 106.6297,
  radius: 500, createdAt: "2024-01-01T00:00:00Z",
}
```

**Luồng test Create Zone:**
```
render → getSafeZones() loads zones
  → Click "Create New Zone" → modal mở
  → Điền name → Click "Simulate Map Click" (stub) → coords set
  → Điền radius → Click "Confirm"
  → createSafeZone({ name, coords, radius }) gọi
  → Modal đóng, zone mới xuất hiện trong list
```

**Test Cases quan trọng:**

| Test Case | Đầu vào | Kết quả |
|---|---|---|
| Render zones | Loaded zones | "Police Station A", "10.8231, 106.6297", "Radius: 500m" |
| Search filter | Type "nonexistent" | Zone card biến mất |
| Select zone | Click card | Zone highlighted |
| Delete → Confirm | Click Delete → Confirm | `deleteSafeZone("zone-1")`, zone removed |
| Delete → Cancel | Click Delete → Cancel | Modal đóng, zone còn lại |
| Create zone | Fill form → Confirm | `createSafeZone({...})` với đúng params |

**Tóm tắt suite:** Kiểm thử đầy đủ CRUD safe zones với cả interactive map (stubbed). Pattern stub map click là giải pháp thông minh để test coordinate selection mà không cần render Leaflet thật.

---

## 4. Context/Hook Unit Tests

### 4.1 `EmergencyRequestRealtimeContext.test.tsx`

**Vị trí:** `contexts/__tests__/`

**Mô tả:** Kiểm thử Context provider cho real-time emergency updates qua STOMP WebSocket.

**Phương pháp thiết kế:** Unit Testing (hook isolation) + Negative Testing (outside provider) + Type Shape Validation.

**Mocks:**
- `@/services/authService` — `getAccessToken`
- `@/services/stompService` — `connect`, `subscribe`, `disconnect`
- `@/contexts/AuthContext` — `user: null`
- `@/contexts/NotificationContext`

**Consumer component dùng để test:**
```typescript
function TestConsumer() {
  const { refresh, realtimeLocation } = useEmergencyRequestRealtime();
  capturedRefresh = refresh;
  capturedLocation = realtimeLocation;
  return null;
}
```

**Test Cases:**

| Test Case | Đầu vào | Kết quả |
|---|---|---|
| Initial state | Mount provider | `refresh === 0`, `realtimeLocation === null` |
| Outside provider | `useEmergencyRequestRealtime()` không có provider | Throws error với đúng message |
| Type shape | Access properties | `type`, `latitude`, `longitude`, `accuracy` tồn tại với đúng type |
| No STOMP khi unauthenticated | `user = null` | `stompService.connect` **không** được gọi |

**Tóm tắt suite:** Unit test thuần túy cho real-time context. Điểm đặc biệt: test xác nhận STOMP connection **không** được mở khi user chưa đăng nhập — tránh connection leak. Test "outside provider" đảm bảo hook không bị dùng sai context.

---

## 5. Advanced Integration Tests (`__tests__/`)

### 5.1 `EmergencyRequestsPage.test.tsx`

**Vị trí:** `__tests__/app/emergency-requests/`

**Mô tả:** Kiểm thử use cases cụ thể của Emergency Requests page với `userEvent` async thay vì `fireEvent`.

**Phương pháp thiết kế:** Use Case Testing (EMERGENCY-UC-02, 03, 04) + Boundary Testing (button disabled states) + State Transition Testing.

**Sự khác biệt với `test/emergency-requests-pages.test.tsx`:**
- Dùng `userEvent.setup()` — mô phỏng user interaction thật (delay, pointer events)
- Test state transitions: DOM thay đổi SAU khi action hoàn thành (button disappears, status updated)
- Typed mocked service: `jest.Mocked<typeof emergencyOpsService>`

**Dữ liệu đầu vào:**
```typescript
pendingRequest = {
  id: "11111111-aaaa-bbbb-cccc-000000000001",
  status: "PENDING",
  senderFirstName: "Alice", senderLastName: "Smith",
  targetFirstName: "Bob", targetLastName: "Jones",
  openedAt: 1_700_000_000_000,
  targetLastLatitude: 10.78, targetLastLongitude: 106.69,
  serviceUsername: "service_unit_1",
}
acceptedRequest = { ...pendingRequest, id: "22222222-...", status: "ACCEPTED" }
```

**Use Cases & Luồng test:**

| UC | Test Case | Luồng | Assertions |
|---|---|---|---|
| UC-03 Accept | "calls acceptEmergencyRequest and updates the row to ACCEPTED" | Click Accept → API → row update | Service called với ID; Accept/Reject buttons removed; Close button added |
| UC-02 Reject | "requires a non-empty reason before submit" | Open reject modal → inspect | Confirm button disabled khi reason empty |
| UC-02 Reject | "submits the rejection with reason" | Type reason → Click Confirm | `rejectEmergencyRequest(id, reason)` gọi; row status = REJECTED |
| UC-04 Close | "requires a completion note before allowing close" | Open close modal → inspect | Confirm disabled khi note empty |
| UC-04 Close | "calls closeEmergencyRequest and marks row CLOSED" | Type note → Confirm | `closeEmergencyRequest(id, note)` gọi; Close button removed |

**Tóm tắt suite:** Suite này là "acceptance test" cho 3 core use cases của Emergency Service workflow. Sự khác biệt quan trọng so với `test/` thông thường: test xác nhận **DOM state transitions** sau action (button visibility thay đổi), không chỉ verify service calls. Đây là level test gần với behavior thực tế nhất trong Jest environment.

---

### 5.2 `SafeZonesPage.test.tsx`

**Vị trí:** `__tests__/app/safe-zones/`

**Mô tả:** Kiểm thử use cases Add/Remove Safe Zone với form validation.

**Phương pháp thiết kế:** Use Case Testing (EMERGENCY-UC-05, 06) + Boundary Testing (disabled states) + Negative Testing (cancel flow).

**Dữ liệu đầu vào:**
```typescript
fixtureZone = {
  id: "sz-001", name: "Central Police Station",
  latitude: 10.78, longitude: 106.69,
  radius: 500, createdAt: "2026-04-01T00:00:00Z",
}
```

**Use Cases & Luồng test:**

| UC | Test Case | Luồng | Assertions |
|---|---|---|---|
| UC-05 Remove | "calls deleteSafeZone and removes zone" | Click Delete → Modal → Confirm | `deleteSafeZone("sz-001")` gọi; zone removed from DOM |
| UC-05 Remove | "does NOT call deleteSafeZone when cancelled" | Click Delete → Modal → Cancel | Cancel button closes modal; zone still visible; API không gọi |
| UC-06 Add | "submits new safe zone with name + coords + radius" | Open modal → Fill form → Map click → Confirm | `createSafeZone({ name, latitudeDegrees, longitudeDegrees, radiusMeters })` |
| UC-06 Add | "disables confirm when name or radius empty" | Clear name → inspect; Clear radius → inspect | Confirm disabled khi name empty; re-enabled khi có name; disabled lại khi radius cleared |

**Validation Boundary Test:**
```
name: ""        + radius: "500"  → Confirm DISABLED
name: "Station" + radius: "500"  → Confirm ENABLED
name: "Station" + radius: ""     → Confirm DISABLED
```

**Tóm tắt suite:** Use case test tập trung vào form validation với boundary conditions. Pattern map stub (button giả lập click trên map) là key design decision để test coordinate selection mà không phụ thuộc vào Leaflet.

---

## 6. Thống Kê Tổng Hợp

| Metric | Giá trị |
|---|---|
| Tổng số file test | 17 |
| Jest test files (`test/`) | 14 |
| Jest test files (`contexts/__tests__/`) | 1 |
| Jest test files (`__tests__/app/`) | 2 |
| Tổng describe blocks (ước tính) | ~60+ |
| Tổng test cases (ước tính) | ~320+ |
| Test runner | Jest + React Testing Library |
| Không có | Pure unit tests, snapshot tests, performance tests, E2E tests |

### Các Phương Pháp Thiết Kế Test Được Sử Dụng

| Phương pháp | Áp dụng ở đâu |
|---|---|
| **Use Case Testing** | Tất cả CRUD pages (crime-reports, missing-persons, guidelines, safe-zones) |
| **Decision Table Testing** | dashboard-layout (role×route), emergency-requests (status×actions) |
| **Equivalence Class Partitioning** | Password validation (match/mismatch), service-level error vs success |
| **State-Based Testing** | Auth states (loading/auth/unauth), guideline tabs, form draft/published states |
| **Boundary Testing** | Form validation (empty fields disable confirm), fake timer boundaries (3s) |
| **Negative Testing** | Null user guards, access denied, API error paths, "Save as Draft" không publish |
| **Modal Flow Testing** | Reject emergency, delete confirmation, zone creation modal |
| **Smoke Testing** | app-layout, providers, dashboard-page — basic render checks |
| **Structural Testing** | Landing page sections, profile form fields |
| **State Transition Testing** | `__tests__/` — DOM state sau action (button visibility thay đổi) |
