## 3. Per-Use-Case Test Specifications

For each use case the **happy-path flow** is validated, plus the most relevant alternate path
(cancel, validation block, role gate, or service failure).

### REPORT-UC-01 — Publish Missing Person Report
**Actor:** Reporter
**Pre-conditions:** A `PENDING` missing-person report exists in the list.

| Step | Action                                       | Expected                                                     |
|------|----------------------------------------------|--------------------------------------------------------------|
| 1    | Render list with PENDING report.             | Publish (CheckCircle) icon button is visible.                |
| 2    | Click Publish.                               | A `ConfirmModal` titled "Publish Missing Person Report" appears. |
| 3    | Click the modal's confirm button.            | `onPublish(id)` is called once with the report's id.         |
| 4    | Click Cancel instead of confirm (variant).   | `onPublish` is **not** called; modal disappears.             |

**Role gate:** when the same list is rendered with a non-Reporter/User role, the Publish button is **not rendered**.

### REPORT-UC-02 — Delete Missing Person Report
**Actor:** Reporter
**Pre-conditions:** Any missing-person report exists in the list.

| Step | Action                  | Expected                                                  |
|------|-------------------------|-----------------------------------------------------------|
| 1    | Click Delete (Trash2).  | Confirm dialog "Delete Missing Person Report" appears.    |
| 2    | Click confirm.          | `onDelete(id)` is called once with the report's id.       |
| 3    | Click cancel (variant). | `onDelete` is **not** called.                             |

**Role gate:** Delete button is hidden when role is `Emergency Service` only.

### REPORT-UC-05 — Publish Guideline Document
**Actor:** Reporter / Admin

| Step | Action                                                                    | Expected                                                                  |
|------|---------------------------------------------------------------------------|---------------------------------------------------------------------------|
| 1    | Click "New Guideline".                                                    | Create form is shown.                                                     |
| 2    | Type Title + Abstract + Content.                                          | Inputs reflect typed values.                                              |
| 3    | Submit.                                                                   | `criminalReportsService.createGuidelinesDocument` called with form values; list re-fetched. |
| 4    | If a User role lacks permission.                                          | "New Guideline" button is **not rendered**.                                |

### REPORT-UC-06 — Delete Guideline Document
**Actor:** Reporter / Admin

| Step | Action                                  | Expected                                                                  |
|------|-----------------------------------------|---------------------------------------------------------------------------|
| 1    | Click delete on a guideline card.       | Confirm dialog appears.                                                   |
| 2    | Confirm.                                | `deleteGuidelinesDocument` and `deleteDocumentFolder` called with id.     |
| 3    | Cancel (variant).                       | Neither service method is called.                                         |

### REPORT-UC-09 — Publish Crime Report
**Actor:** Reporter
**Pre-conditions:** Crime report with `isPublic: false`.

Same modal pattern as UC-01 (Publish):
- Publish (Globe) icon visible only for non-public reports.
- Confirming calls `onPublish(id)`.
- Cancel suppresses the call.

### REPORT-UC-10 — Delete Crime Report
**Actor:** Reporter

Same modal pattern as UC-02 — confirm calls `onDelete(id)`.

### EMERGENCY-UC-02 — Reject Emergency Request
**Actor:** Emergency Service

| Step | Action                                       | Expected                                                          |
|------|----------------------------------------------|-------------------------------------------------------------------|
| 1    | Click reject on a `PENDING` row.             | Reject modal opens with reason textarea.                          |
| 2    | Confirm with empty reason.                   | Confirm button is **disabled** — no API call.                     |
| 3    | Type a reason and confirm.                   | `emergencyOpsService.rejectEmergencyRequest(id)` called; status updates to REJECTED in the row. |

### EMERGENCY-UC-03 — Accept Emergency Request
**Actor:** Emergency Service

| Step | Action                                  | Expected                                                            |
|------|-----------------------------------------|---------------------------------------------------------------------|
| 1    | Click accept on a `PENDING` row.        | `emergencyOpsService.acceptEmergencyRequest(id)` called once.       |
| 2    | After resolution.                       | Row status flips to `ACCEPTED`; success toast is fired.             |

### EMERGENCY-UC-04 — Complete (Close) Emergency Request
**Actor:** Emergency Service
**Pre-conditions:** An `ACCEPTED` request exists.

| Step | Action                                       | Expected                                                              |
|------|----------------------------------------------|-----------------------------------------------------------------------|
| 1    | Click ClipboardCheck icon on `ACCEPTED` row. | Close modal opens with completion-note textarea.                      |
| 2    | Confirm with empty note.                     | Confirm button is disabled.                                           |
| 3    | Type a note and confirm.                     | `emergencyOpsService.closeEmergencyRequest(id)` called; row → CLOSED. |

### EMERGENCY-UC-05 — Remove Safe Zone
**Actor:** Emergency Service

| Step | Action                                       | Expected                                                       |
|------|----------------------------------------------|----------------------------------------------------------------|
| 1    | Click Trash icon on a row.                   | Confirm dialog "Delete Safe Zone" appears.                     |
| 2    | Confirm.                                     | `emergencyOpsService.deleteSafeZone(id)` called once. Row removed from list. |
| 3    | Cancel (variant).                            | Service is not called.                                         |

### EMERGENCY-UC-06 — Add Safe Zone
**Actor:** Emergency Service

| Step | Action                                       | Expected                                                                                |
|------|----------------------------------------------|-----------------------------------------------------------------------------------------|
| 1    | Click "Add Safe Zone".                       | Create modal opens with map + fields (name, type, address, radius).                     |
| 2    | Submit without selecting a location.         | Confirm button **disabled** (no `selectedLocation`).                                    |
| 3    | Pick a location (simulated via `MapView` stub `onMapClick`), fill name + radius, confirm. | `emergencyOpsService.createSafeZone({...})` called with the typed name, lat/lng, radius. |

---

## 3. Per-Use-Case Test Specifications

### TRACK-UC-02 — Enable / Disable Location Sharing
**Context under test:** `TrackingContext`

| Step | Action | Expected |
|---|---|---|
| 1 | Mount `TrackingProvider`; call `setShareLocation(true)` | `AsyncStorage.setItem(SHARE_LOCATION_KEY, "true")` called; state becomes `true` |
| 2 | Call `setShareLocation(false)` | `AsyncStorage.setItem(SHARE_LOCATION_KEY, "false")` called; state becomes `false` |
| 3 | Mount with `"true"` pre-stored | `shareLocation` initialises to `true` from storage |

---

### TRACK-UC-03 — Create Circle
**Screen:** `NewFamilyCircle` (2-step form)

| Step | Action | Expected |
|---|---|---|
| 1 | Render step 1. Next button with no name typed. | Next button is disabled. |
| 2 | Type a circle name → tap Next. | Advances to step 2 (role grid appears). |
| 3 | On step 2, tap Create. | `createFamilyCircle(name, role)` called; `router.back()` called. |
| 4 | Tap Next with empty name (variant). | `showToast` is called; step remains 1. |

---

### TRACK-UC-06 — Remove Member From Circle
**Screen:** `ManageTrackersScreen`

| Step | Action | Expected |
|---|---|---|
| 1 | Mount screen. | `listFamilyCircles` called; member `alice` appears in the list. |
| 2 | Press trash icon on `alice`'s row. | `Alert.alert` shown with member name in message. |
| 3 | Press the destructive button in the alert. | `removeMemberFromFamilyCircle(circleId, memberId)` called; `alice` removed from list. |
| 4 | Press cancel in the alert. | Service **not** called; `alice` still in list. |

---

### REPORT-UC-00 — Submit Missing Person Report
**Screen:** `CreateMissingScreen` (4-step form)

| Step | Action | Expected |
|---|---|---|
| 1 | Render step 1; tap Next with no name. | `showAlert` called with validation error; stays on step 1. |
| 2 | Fill full name → Next → fill title + personalId + description → Next → fill phone → Next. | Arrives at step 4 (review). |
| 3 | Tap Submit on step 4. | `createMissingPersonReport` called with correct `{ title, fullName, personalId, ... }` payload. |
| 4 | Submission resolves. | `showAlert` called with success type. |

---

### REPORT-UC-04 / REPORT-UC-07 / REPORT-UC-08 — View Reports Tabs
**Screen:** `ReportsScreen`

| Step | Action | Expected |
|---|---|---|
| 1 | Mount; `fetchReports` resolves with one crime report. | Crime report title rendered. |
| 2 | Mount; `fetchMissingPersons` resolves with one person. | Person name rendered. |
| 3 | Mount; `fetchGuides` resolves with one guide. | Guide title rendered. |
| 4 | FAB visible on Crime tab and Missing tab; absent on Guide tab. | `createReport` label present/absent per tab. |
| 5 | Press a crime report card. | `router.push` called with correct report-detail route. |
| 6 | Press a guide card. | `router.push` called with guideline-detail route. |

---

### EMERGENCY-UC-00 — Activate Emergency Alert (SOS Button)
**Screen:** `SosScreen`

| Step | Action | Expected |
|---|---|---|
| 1 | Render without `autoActivate`. | Countdown number and swipe-to-cancel label visible. |
| 2 | Render with `autoActivate=1`; `createEmergencyRequest` resolves. | `createEmergencyRequest` called once; `router.replace("/map")` called. |
| 3 | `createEmergencyRequest` rejects with 409. | `isAlreadyActive` toast shown; `router.replace("/map")` still called. |
| 4 | Render without `autoActivate`; advance fake timers 10 s. | Countdown reaches 0; `createEmergencyRequest` called. |

---

### EMERGENCY-UC-01 — Activate Emergency Alert (Voice)
**Hook:** `useVoiceSosActivation`

| Step | Action | Expected |
|---|---|---|
| 1 | Render hook with `enabled=true`; fire result event with `"help me"`. | `router.push("/sos")` called once. |
| 2 | Fire result with `"hello world"` (non-trigger). | Navigation **not** called. |
| 3 | Set pathname to `"/sos"`; fire trigger phrase. | Navigation **not** called (already on SOS). |
| 4 | Render hook with `enabled=false`. | `ExpoSpeechRecognitionModule.stop` called; no navigation on trigger. |

---

### EMERGENCY-UC-07 — Find Safe Zone
**Screen:** `SafeZonesScreen`

| Step | Action | Expected |
|---|---|---|
| 1 | Location available; `getNearestSafeZones` resolves with one zone. | Zone name appears in the list. |
| 2 | Type a name in search that matches the zone. | Zone still shown. |
| 3 | Type a name that does NOT match. | Zone not shown (filtered out). |
| 4 | No location yet. | Service not called; list remains empty. |

---