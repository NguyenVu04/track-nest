# TrackNest Web – Use Case Test Plan (Jest + React Testing Library)

This document maps every use case in [`WEB_FEATURES.md`](./WEB_FEATURES.md) to one or more
component-level Jest tests. The tests follow the
[Next.js Jest testing guide](https://nextjs.org/docs/app/guides/testing) and run with
`next/jest` against React Testing Library + jest-dom in a `jsdom` environment.

> Cypress (see [`cypress/TEST-PLAN.md`](./cypress/TEST-PLAN.md)) covers the same flows at the
> browser/HTTP layer. The Jest tests in this document complement that by exercising the React
> components directly with mocked services — far cheaper to run on every commit, and well-suited
> to driving coverage over branching role logic and confirm-dialog state machines.

---

## 1. Conventions

| Concern              | Approach                                                                                                  |
|----------------------|-----------------------------------------------------------------------------------------------------------|
| Test framework       | Jest 29 (`next/jest` preset), `jsdom` environment.                                                        |
| Component driver     | `@testing-library/react` + `@testing-library/user-event` v14.                                             |
| Assertions           | `@testing-library/jest-dom` matchers (`toBeInTheDocument`, `toHaveTextContent`, ...).                     |
| `next-intl`          | Mocked in `jest.setup.ts` — `useTranslations` returns the **key** so tests can match by stable strings.   |
| `next/navigation`    | `useRouter`/`usePathname` mocked to no-op.                                                                |
| `sonner` toast       | `toast.success` / `toast.error` mocked to spies.                                                          |
| `MapView` (Leaflet)  | Replaced with a stub `<div data-testid="map" />` per test.                                                |
| Service modules      | Mocked per-suite with `jest.mock("@/services/...")`.                                                      |
| Auth/User context    | `useAuth` mocked to return a fixture user with the role under test.                                       |

The test entrypoint is `npm test` (`jest --coverage`).

---

## 2. Use Case → Test Mapping

### 2.1 Reporter use cases

| WEB_FEATURES ID | Use Case                          | Component under test                  | Test file                                               |
|-----------------|-----------------------------------|---------------------------------------|---------------------------------------------------------|
| REPORT-UC-01    | Publish Missing Person Report     | `MissingPersonList`                   | `__tests__/components/missing-persons/MissingPersonList.test.tsx` |
| REPORT-UC-02    | Delete Missing Person Report      | `MissingPersonList`                   | `__tests__/components/missing-persons/MissingPersonList.test.tsx` |
| REPORT-UC-05    | Publish Guideline Document        | `GuidelineDashboard`                  | `__tests__/components/shared/GuidelineDashboard.test.tsx`         |
| REPORT-UC-06    | Delete Guideline Document         | `GuidelineDashboard`                  | `__tests__/components/shared/GuidelineDashboard.test.tsx`         |
| REPORT-UC-09    | Publish Crime Report              | `CrimeReportList`                     | `__tests__/components/crime-reports/CrimeReportList.test.tsx`     |
| REPORT-UC-10    | Delete Crime Report               | `CrimeReportList`                     | `__tests__/components/crime-reports/CrimeReportList.test.tsx`     |
| REPORT-UC-11    | Generate Crime Analysis Report    | `DashboardSummary` (deferred)         | _Not yet automated — depends on Recharts; see §5._                |

### 2.2 Emergency Service use cases

| WEB_FEATURES ID  | Use Case                          | Component under test                | Test file                                                      |
|------------------|-----------------------------------|-------------------------------------|----------------------------------------------------------------|
| EMERGENCY-UC-02  | Reject an Emergency Request       | `EmergencyRequestsPage`             | `__tests__/app/emergency-requests/EmergencyRequestsPage.test.tsx` |
| EMERGENCY-UC-03  | Accept an Emergency Request       | `EmergencyRequestsPage`             | `__tests__/app/emergency-requests/EmergencyRequestsPage.test.tsx` |
| EMERGENCY-UC-04  | Complete an Emergency Request     | `EmergencyRequestsPage`             | `__tests__/app/emergency-requests/EmergencyRequestsPage.test.tsx` |
| EMERGENCY-UC-05  | Remove Safe Zone                  | `SafeZonesPage`                     | `__tests__/app/safe-zones/SafeZonesPage.test.tsx`                 |
| EMERGENCY-UC-06  | Add Safe Zone                     | `SafeZonesPage`                     | `__tests__/app/safe-zones/SafeZonesPage.test.tsx`                 |

---

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

## 4. Variables & Equivalence Classes

The Jest layer focuses on **state-machine** behaviours rather than input-validation BVA (which
Cypress already covers end-to-end). The most important classes asserted here:

| Variable                        | Classes asserted in Jest                                            |
|---------------------------------|---------------------------------------------------------------------|
| `userRole` (UserRole[])         | `["Reporter"]` ⇒ actions visible · `["Emergency Service"]` ⇒ hidden |
| Missing person `status`         | `PENDING` ⇒ Publish button rendered · others ⇒ hidden               |
| Crime report `isPublic`         | `false` ⇒ Publish (globe) rendered · `true` ⇒ hidden                |
| Emergency request `status`      | `PENDING` ⇒ Accept/Reject visible · `ACCEPTED` ⇒ Close visible · `CLOSED`/`REJECTED` ⇒ no actions |
| Reject reason textarea          | empty ⇒ confirm disabled · non-empty ⇒ confirm enabled              |
| Completion-note textarea        | empty ⇒ confirm disabled · non-empty ⇒ confirm enabled              |
| Safe zone `selectedLocation`    | `null` ⇒ confirm disabled · valid `[lat,lng]` ⇒ enabled             |

---

## 5. Out-of-scope / Deferred

1. **REPORT-UC-11 (Crime Analysis Report)** — relies on Recharts SVG output, file downloads,
   and date-range services. A dedicated suite using Recharts + jest-canvas-mock is the right
   vehicle; not implemented in this iteration.
2. **Login / RBAC redirects** — already covered by Cypress (`auth/login.cy.ts`, `navigation/rbac.cy.ts`).
3. **Real-time STOMP notifications** — covered by smoke tests in Cypress; STOMP requires a live
   broker, so we do not unit-test the realtime context.
4. **Map interaction internals** (Leaflet click → coordinate translation). Stubbed.

---

## 6. File layout

```
__tests__/
├── components/
│   ├── crime-reports/
│   │   └── CrimeReportList.test.tsx           # REPORT-UC-09, REPORT-UC-10
│   ├── missing-persons/
│   │   └── MissingPersonList.test.tsx         # REPORT-UC-01, REPORT-UC-02
│   └── shared/
│       ├── ConfirmModal.test.tsx              # foundational
│       └── GuidelineDashboard.test.tsx        # REPORT-UC-05, REPORT-UC-06
└── app/
    ├── emergency-requests/
    │   └── EmergencyRequestsPage.test.tsx     # EMERGENCY-UC-02, UC-03, UC-04
    └── safe-zones/
        └── SafeZonesPage.test.tsx             # EMERGENCY-UC-05, UC-06
jest.setup.ts                                   # jest-dom + next-intl/next-navigation mocks
jest.config.ts                                  # registers setup + adds tested files to coverage
```

Run with:

```bash
npm test                # all suites with coverage
npm test -- MissingPersonList   # one suite
```
