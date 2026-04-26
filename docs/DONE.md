# Integration Checklist

This document tracks what has been integrated from the backend microservices into the frontend web application.

---

## Backend API Documentation

- [x] Created `service/criminal-reports/API.md` — documents all 7 controllers and their endpoints
- [x] Created `service/emergency-ops/API.md` — documents 5 controllers (emergency receiver, manager, responder, safe-zone manager/locator)
- [x] Created `service/user-tracking/API.md` — documents 3 gRPC controllers (tracker, tracking manager, notifier)

---

## `criminalReportsService.ts` (port 38080)

### Missing Persons
- [x] `createMissingPersonReport` — POST `/missing-person-reporter/reports`
- [x] `submitMissingPersonReport` — POST `/missing-person-reporter/reports/{id}/submit`
- [x] `getMissingPersonReport` — GET `/missing-person-reporter/reports/{id}`
- [x] `listMissingPersonReports` — GET `/missing-person-reporter/reports` (paginated, with filters)
- [x] `listMissingPersonReportsPublic` — GET `/missing-person-locator/reports/public`
- [x] `updateMissingPersonReport` — PATCH `/missing-person-reporter/reports/{id}`
- [x] `publishMissingPersonReport` — POST `/missing-person-reporter/reports/{id}/publish`
- [x] `rejectMissingPersonReport` — POST `/missing-person-reporter/reports/{id}/reject`
- [x] `deleteMissingPersonReport` — DELETE `/missing-person-reporter/reports/{id}`

### Crime Reports
- [x] `createCrimeReport` — POST `/crime-reporter/reports`
- [x] `getCrimeReport` — GET `/crime-reporter/reports/{id}`
- [x] `listCrimeReports` — GET `/crime-reporter/reports` (paginated)
- [x] `listCrimeReportsPublic` — GET `/crime-locator/reports/public`
- [x] `updateCrimeReport` — PATCH `/crime-reporter/reports/{id}`
- [x] `publishCrimeReport` — POST `/crime-reporter/reports/{id}/publish`
- [x] `deleteCrimeReport` — DELETE `/crime-reporter/reports/{id}`

### Guidelines Documents
- [x] `createGuidelinesDocument` — POST `/guidelines-manager/documents`
- [x] `getGuidelinesDocument` — GET `/guidelines-manager/documents/{id}`
- [x] `listGuidelinesDocuments` — GET `/guidelines-manager/documents` (paginated)
- [x] `listGuidelinesDocumentsPublic` — GET `/guidelines-locator/documents/public`
- [x] `updateGuidelinesDocument` — PATCH `/guidelines-manager/documents/{id}`
- [x] `publishGuidelinesDocument` — POST `/guidelines-manager/documents/{id}/publish`
- [x] `deleteGuidelinesDocument` — DELETE `/guidelines-manager/documents/{id}`

### File Management
- [x] `uploadFile` — POST `/file-manager/files`
- [x] `deleteFile` — DELETE `/file-manager/files/{fileId}`
- [x] `getFileUrl` — GET `/file-manager/files/{fileId}`

### Auth / Headers
- [x] Added `X-User-Id` header injection via `authService.getUserId()` in the Axios interceptor
- [x] Added `getUserId()` to `authService.ts` (reads `keycloak.tokenParsed.sub`)

---

## `emergencyOpsService.ts` (port 28080)

### Emergency Request Receiver (User)
- [x] `sendEmergencyRequest` — POST `/emergency-request-receiver/requests`
- [x] `getMyEmergencyRequests` — GET `/emergency-request-receiver/requests`

### Emergency Request Manager (Emergency Services)
- [x] `updateEmergencyServiceLocation` — PATCH `/emergency-request-manager/emergency-service/location`
- [x] `getEmergencyServiceLocation` — GET `/emergency-request-manager/emergency-service/location`
- [x] `getEmergencyRequestCount` — GET `/emergency-request-manager/requests/count`
- [x] `getEmergencyRequests` — GET `/emergency-request-manager/requests`
- [x] `acceptEmergencyRequest` — PATCH `/emergency-request-manager/requests/{id}/accept`
- [x] `rejectEmergencyRequest` — PATCH `/emergency-request-manager/requests/{id}/reject`
- [x] `closeEmergencyRequest` — PATCH `/emergency-request-manager/requests/{id}/close`

### Emergency Responder
- [x] `getEmergencyTargets` — GET `/emergency-responder/targets`

### Safe Zone Manager (Emergency Services)
- [x] `createSafeZone` — POST `/safe-zone-manager/safe-zone`
- [x] `getSafeZones` — GET `/safe-zone-manager/safe-zones`
- [x] `updateSafeZone` — PUT `/safe-zone-manager/safe-zone/{id}`
- [x] `deleteSafeZone` — DELETE `/safe-zone-manager/safe-zone/{id}`

### Safe Zone Locator
- [x] `getNearestSafeZones` — GET `/safe-zone-locator/safe-zones/nearest`

---

## `userTrackingService.ts` (port 18080 HTTP gateway → gRPC 19090)

### Family Circle CRUD
- [x] `familyCircle.create` — POST `/tracking-manager/family-circles`
- [x] `familyCircle.list` — GET `/tracking-manager/family-circles`
- [x] `familyCircle.get` — GET `/tracking-manager/family-circles/{id}`
- [x] `familyCircle.update` — PUT `/tracking-manager/family-circles/{id}`
- [x] `familyCircle.delete` — DELETE `/tracking-manager/family-circles/{id}`

### Family Circle Membership
- [x] `familyCircle.listMembers` — GET `/tracking-manager/family-circles/{id}/members`
- [x] `familyCircle.addMember` — POST `/tracking-manager/family-circles/{id}/members`
- [x] `familyCircle.removeMember` — DELETE `/tracking-manager/family-circles/{id}/members/{memberId}`
- [x] `familyCircle.updateMemberRole` — PATCH `/tracking-manager/family-circles/{id}/members/{memberId}/role`
- [x] `familyCircle.requestJoin` — POST `/tracking-manager/family-circles/{id}/join`
- [x] `familyCircle.leave` — POST `/tracking-manager/family-circles/{id}/leave`

### Invite Codes
- [x] `familyCircle.createPermission` — POST `/tracking-manager/permissions`
- [x] `familyCircle.joinWithCode` — POST `/tracking-manager/permissions/join`

### Location Tracking
- [x] `tracking.enable` — POST `/tracking-manager/tracking/enable`
- [x] `tracking.disable` — POST `/tracking-manager/tracking/disable`
- [x] `tracking.getStatus` — GET `/tracking-manager/tracking/status`
- [x] `tracking.getCurrentLocation` — GET `/tracking-manager/location/current`
- [x] `tracking.getTargetLocation` — GET `/tracking-manager/location/target/{targetId}`
- [x] `tracking.getLocationHistory` — GET `/tracking-manager/location/history/{targetId}`

### Notifications
- [x] `notifications.listTracking` — GET `/notifier/tracking-notifications`
- [x] `notifications.listRisk` — GET `/notifier/risk-notifications`
- [x] `notifications.deleteTrackingNotification` — DELETE `/notifier/tracking-notifications/{id}`
- [x] `notifications.deleteRiskNotification` — DELETE `/notifier/risk-notifications/{id}`
- [x] `notifications.clearTracking` — DELETE `/notifier/tracking-notifications`
- [x] `notifications.clearRisk` — DELETE `/notifier/risk-notifications`
- [x] `notifications.countTracking` — GET `/notifier/tracking-notifications/count`
- [x] `notifications.countRisk` — GET `/notifier/risk-notifications/count`

### Mobile Devices
- [x] `mobileDevice.register` — POST `/notifier/devices`
- [x] `mobileDevice.unregister` — DELETE `/notifier/devices/{id}`
- [x] `mobileDevice.update` — PATCH `/notifier/devices/{id}`
- [x] `mobileDevice.list` — GET `/notifier/devices`

---

## Dashboard Pages

### Missing Persons (`/dashboard/missing-persons`)
- [x] List page — fetches from `listMissingPersonReports`, delete via `deleteMissingPersonReport`
- [x] Create page — submits via `createMissingPersonReport`
- [x] Detail page (`/[id]`) — fetches via `getMissingPersonReport`, publish/delete wired
- [x] Edit page (`/[id]/edit`) — fetches report, saves via `updateMissingPersonReport`

### Crime Reports (`/dashboard/crime-reports`)
- [x] List page — fetches from `listCrimeReports`, publish/delete wired
- [x] Create page — submits via `createCrimeReport`
- [x] Detail page (`/[id]`) — fetches via `getCrimeReport`, delete wired
- [x] Edit page (`/[id]/edit`) — fetches report, saves via `updateCrimeReport`

### Guidelines (`/dashboard/guidelines`)
- [x] List page — fetches from `listGuidelinesDocuments`, delete wired
- [x] Create page — publish flow: `createGuidelinesDocument` + `publishGuidelinesDocument`; draft: `createGuidelinesDocument` only
- [x] Detail page (`/[id]`) — fetches via `getGuidelinesDocument`, publish/delete wired

### Emergency Requests (`/dashboard/emergency-requests`)
- [x] List page — uses `getEmergencyRequests`, `acceptEmergencyRequest`, `rejectEmergencyRequest`, `closeEmergencyRequest`

### Safe Zones (`/dashboard/safe-zones`)
- [x] List/manage page — uses `getSafeZones`, `createSafeZone`, `deleteSafeZone`, `getNearestSafeZones`

### Family Circles (`/dashboard/family-circles`) — **NEW**
- [x] List page — uses `familyCircle.list`, `familyCircle.create`, `familyCircle.delete`, `familyCircle.joinWithCode`
- [x] Detail page (`/[id]`) — uses `familyCircle.get`, `familyCircle.listMembers`, `familyCircle.update`, `familyCircle.updateMemberRole`, `familyCircle.removeMember`, `familyCircle.createPermission`
- [x] Sidebar nav item added ("Family Circles" / "Vòng Gia Đình")

---

## Role Bypass Fix

All `userRole === "Reporter"` gates updated to `(userRole === "Reporter" || userRole === "User")` since current accounts only have `role === "User"`:

- [x] `MissingPersonList.tsx`
- [x] `CrimeReportList.tsx`
- [x] `CrimeReportDetail.tsx`
- [x] Create/list pages: removed `Reporter`-only guards from "New Report" buttons
- [x] `isPublic` default: changed from `user?.role !== "Reporter"` to `false` in list pages

---

## Known Limitations / Future Work

- User-tracking service REST gateway at port 18080 is assumed; actual gRPC calls are proxied server-side
- Mobile device registration page not created (device tokens are platform-specific; no UI needed for web)
- Notifications page not created (could be added as `/dashboard/notifications` using `userTrackingService.notifications.*`)
- Account management relies on an external Keycloak Admin API; no dedicated service created yet
