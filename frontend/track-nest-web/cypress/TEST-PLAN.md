# TrackNest Web – Cypress Test Plan

## 1. Overview

This document describes the full Cypress end-to-end test suite for the **TrackNest Control Centre** web application (`track-nest-web`). It covers:

- The testing techniques used and why each was chosen
- Every variable under test, its valid range, equivalence classes, and boundary values
- All test scenarios mapped to their test IDs
- The data flow and user flows being verified

---

## 2. Application Under Test

| Attribute        | Value                                               |
|------------------|-----------------------------------------------------|
| Framework        | Next.js 16 (App Router)                             |
| Auth             | Keycloak (OAuth 2.0 / OIDC) – mocked in tests       |
| API services     | Criminal Reports (`:28080`), Emergency Ops (`:28080`), User Tracking (`:38080`) |
| State management | React Context (`AuthContext`, `NotificationContext`) |
| Base URL (test)  | `http://localhost:3000`                             |

---

## 3. Testing Techniques

### 3.1 Boundary Value Analysis (BVA)

**Definition:** Tests are written at and just beyond the minimum and maximum valid values of an input. Errors cluster at boundaries.

**Applied to:**

| Field                  | Min     | Max     | Below-min    | Above-max |
|------------------------|---------|---------|--------------|-----------|
| `severity` (select)    | 1       | 5       | N/A (select) | N/A       |
| `numberOfVictims`      | 0       | ∞ (int) | -1 (invalid) | –         |
| `numberOfOffenders`    | 0       | ∞ (int) | -1 (invalid) | –         |
| `latitude`             | -90     | 90      | < -90        | > 90      |
| `longitude`            | -180    | 180     | < -180       | > 180     |
| `radius` (safe zones)  | 1 m     | 50 000 m| 0 / negative | very large|
| `title` length         | 1 char  | 255 char| 0 chars      | 256+      |
| `fullName` length      | 1 char  | 100 char| 0 chars      | –         |

**Test IDs:** BVA-T01 – BVA-T03, BVA-S01 – BVA-S05, BVA-V01 – BVA-O02, BVA-LAT01 – BVA-LON03, BVA-GL-T01 – BVA-GL-T03, BVA-SZ-NAME01 – BVA-SZ-LON02

---

### 3.2 Equivalence Class Partitioning (ECP)

**Definition:** Divide valid and invalid inputs into classes where all members within a class are expected to behave the same. One representative from each class is sufficient.

**Classes defined:**

#### Contact Email (`type="email"`)
| Class              | Representative          | Expected Result    |
|--------------------|-------------------------|--------------------|
| Valid email        | `user@example.com`      | Input valid = true |
| No `@` symbol      | `invalidemail.com`      | Input valid = false|
| No domain          | `user@`                 | Input valid = false|
| Empty (optional)   | `""`                    | Input valid = true |
| Subdomain email    | `user@mail.example.org` | Input valid = true |

#### Photo URL (`type="url"`)
| Class              | Representative                      | Expected Result    |
|--------------------|-------------------------------------|--------------------|
| Valid https URL    | `https://example.com/photo.jpg`     | Input valid = true |
| No protocol        | `not-a-valid-url`                   | Input valid = false|
| Empty (optional)   | `""`                                | Input valid = true |

#### Date Missing (crime / missing person)
| Class       | Representative   | Expected Result    |
|-------------|------------------|--------------------|
| Past date   | `2020-06-15`     | Accepted           |
| Today       | current date     | Accepted           |
| Future date | `2030-12-31`     | Accepted           |

#### Severity (Crime Report)
| Class         | Range  | Representative |
|---------------|--------|----------------|
| Low           | 1–2    | `1`            |
| Medium        | 3      | `3`            |
| High-Critical | 4–5    | `5`            |

#### Search Terms (all list pages)
| Class         | Representative     | Expected Result                |
|---------------|--------------------|--------------------------------|
| Exact match   | `"Sarah Johnson"`  | Shows matching record          |
| Partial match | `"Sarah"`          | Shows matching records         |
| No match      | `"ZZNOTEXIST"`     | Hides all records              |
| Empty string  | `""`               | Restores full list             |
| Case diff     | `"margaret"`       | Case-insensitive match         |

#### Personal ID (Missing Person)
| Class            | Representative  | Expected Result |
|------------------|-----------------|-----------------|
| Alphanumeric     | `DL-123456`     | Accepted        |
| Numeric-only     | `0123456789`    | Accepted        |
| Passport-style   | `PASS-LX5532`   | Accepted        |
| Empty (required) | `""`            | Blocks submit   |

#### Safe Zone Type (select)
| Class          | Value            |
|----------------|------------------|
| Police Station | `Police Station` |
| Hospital       | `Hospital`       |
| Shelter        | `Shelter`        |
| Other          | `Other`          |

#### Emergency Request Status filter
| Class     | Value       |
|-----------|-------------|
| All       | `""` / All  |
| Pending   | `PENDING`   |
| Accepted  | `ACCEPTED`  |
| Completed | `COMPLETED` |

**Test IDs:** ECP-EMAIL-01 – ECP-EMAIL-04, ECP-PHOTO-01 – ECP-PHOTO-03, ECP-DATE-01 – ECP-DATE-03, ECP-PID-01 – ECP-PID-04, ECP-SEV-LOW / MED / HIGH, ECP-SEARCH-MATCH / PARTIAL / NOMATCH / CLEAR / CASE, ECP-SZ-TYPE-01 – ECP-SZ-TYPE-04, ECP-ER-SEARCH-01 – ECP-ER-SEARCH-03, ECP-STATUS-*

---

### 3.3 Decision Table Technique

**Definition:** A table that maps combinations of conditions (inputs/states) to actions/outcomes. Used to ensure all significant combinations are covered.

#### Decision Table A – Authentication State × Target Route

| Auth State      | Target Route                    | Expected Outcome           |
|-----------------|---------------------------------|----------------------------|
| Unauthenticated | `/login`                        | Login page rendered        |
| Unauthenticated | `/dashboard/missing-persons`    | Redirect → `/login`        |
| Authenticated   | `/login`                        | Redirect → `/dashboard`    |
| Authenticated   | `/dashboard/missing-persons`    | Dashboard rendered         |

#### Decision Table B – Role × Route Access

| Role               | Route                         | Outcome              |
|--------------------|-------------------------------|----------------------|
| Reporter           | `/dashboard/missing-persons`  | ACCESSIBLE           |
| Reporter           | `/dashboard/crime-reports`    | ACCESSIBLE           |
| Reporter           | `/dashboard/guidelines`       | ACCESSIBLE           |
| Reporter           | `/dashboard/safe-zones`       | ACCESS DENIED        |
| Reporter           | `/dashboard/emergency-requests`| ACCESS DENIED       |
| Admin              | `/dashboard/accounts`         | ACCESSIBLE           |
| Admin              | `/dashboard/safe-zones`       | ACCESS DENIED        |
| Emergency Services | `/dashboard/safe-zones`       | ACCESSIBLE           |
| Emergency Services | `/dashboard/emergency-requests`| ACCESSIBLE          |
| User               | `/dashboard/missing-persons`  | ACCESSIBLE           |
| User               | `/dashboard/safe-zones`       | ACCESS DENIED        |

#### Decision Table C – Role × Sidebar Visibility

| Sidebar Item       | Reporter | Emergency Svcs | Admin   | User    |
|--------------------|----------|----------------|---------|---------|
| Overview           | VISIBLE  | VISIBLE        | VISIBLE | VISIBLE |
| Missing Persons    | VISIBLE  | VISIBLE        | VISIBLE | VISIBLE |
| Crime Reports      | VISIBLE  | VISIBLE        | VISIBLE | VISIBLE |
| Guidelines         | VISIBLE  | VISIBLE        | VISIBLE | VISIBLE |
| Emergency Requests | HIDDEN   | VISIBLE        | HIDDEN  | HIDDEN  |
| Safe Zones         | HIDDEN   | VISIBLE        | HIDDEN  | HIDDEN  |
| Accounts           | HIDDEN   | HIDDEN         | VISIBLE | HIDDEN  |

#### Decision Table D – Role × Create Action Visibility

| Feature              | Reporter | Emergency Svcs | Admin  | User   |
|----------------------|----------|----------------|--------|--------|
| Create Crime Report  | VISIBLE  | HIDDEN         | HIDDEN | HIDDEN |
| Create Missing Person| VISIBLE  | HIDDEN         | HIDDEN | HIDDEN |
| Create Guideline     | VISIBLE  | HIDDEN         | HIDDEN | HIDDEN |
| Add Safe Zone        | N/A      | VISIBLE        | N/A    | N/A    |

#### Decision Table E – Missing Person Status × Available Actions

| Status    | Publish | Delete | View Detail |
|-----------|---------|--------|-------------|
| PENDING   | YES     | YES    | YES         |
| PUBLISHED | NO      | YES    | YES         |
| RESOLVED  | NO      | YES    | YES         |
| DELETED   | NO      | NO     | YES         |

#### Decision Table F – Emergency Request Status × Available Actions

| Status    | Accept | Reject | Complete |
|-----------|--------|--------|----------|
| PENDING   | YES    | YES    | NO       |
| ACCEPTED  | NO     | NO     | YES      |
| COMPLETED | NO     | NO     | NO       |
| REJECTED  | NO     | NO     | NO       |

**Test IDs:** DT-R01 – DT-R04, DT-A01 – DT-A02, DT-E01 – DT-E02, DT-U01 – DT-U02, DT-SZ-01 – DT-SZ-04, DT-MP-01 – DT-MP-03, DT-STATUS-01 – DT-STATUS-03, DT-ER-01 – DT-ER-04

---

### 3.4 Use-Case Testing

**Definition:** Tests that simulate real user interaction flows from start to finish, including happy paths and exception paths.

#### Use Cases Covered

| ID        | Title                                        | Actor              | Flow Summary                                                      |
|-----------|----------------------------------------------|--------------------|-------------------------------------------------------------------|
| UC-01     | Unauthenticated user sees login page         | Anonymous          | Visit `/login` → card visible                                     |
| UC-02     | Protected route redirect                     | Anonymous          | Visit `/dashboard/*` → redirect to `/login`                       |
| UC-03     | Authenticated user bypasses login            | Any role           | Visit `/login` with auth → redirect to dashboard                  |
| UC-04     | Direct dashboard access                      | Any role           | Visit `/dashboard/missing-persons` → page renders                 |
| UC-05     | Logout clears session                        | Any role           | Click Logout → localStorage cleared → redirect to login           |
| UC-CR-01  | Reporter creates crime report end-to-end     | Reporter           | Fill form → Review modal → Confirm → API call made                |
| UC-CR-02  | Review modal before submit                   | Reporter           | Submit form → review modal appears → data correct                 |
| UC-CR-03  | Back to Edit from review modal               | Reporter           | Submit → review → Back to Edit → form still populated             |
| UC-CR-04  | Cancel returns to list                       | Reporter           | Click Cancel → no API call made                                   |
| UC-CRL-01 | Crime reports list renders                   | Reporter           | Page load → all fixture reports visible                           |
| UC-CRL-02 | Search crime reports                         | Reporter           | Type in search box → filtered results                             |
| UC-CRL-03 | Publish crime report                         | Reporter           | Click publish button → API called                                 |
| UC-CRL-04 | Delete crime report                          | Reporter           | Click delete → confirm modal → API called                         |
| UC-MP-01  | Reporter creates missing person report       | Reporter           | Fill all required fields → Submit → API call made                 |
| UC-MP-03  | Cancel without submitting                    | Reporter           | Fill partial data → Cancel → no API call                          |
| UC-MP-04  | Required field validation                    | Reporter           | Leave each required field empty → submit blocked                  |
| UC-MPL-01 | Missing persons list renders                 | Reporter           | Page load → all persons from fixture visible                      |
| UC-MPL-02 | Search missing persons                       | Reporter           | Search → filtered results                                         |
| UC-MPL-03 | Navigate to create form                      | Reporter           | Click New → navigates to create page                              |
| UC-SZ-01  | Emergency Services views safe zones          | Emergency Services | Page loads → zones from fixture listed                            |
| UC-SZ-02  | Create safe zone                             | Emergency Services | Open modal → fill form → Confirm → API called → toast shown       |
| UC-SZ-03  | Delete safe zone with confirmation           | Emergency Services | Click delete → confirm → API called; cancel → no call             |
| UC-SZ-04  | Search safe zones                            | Emergency Services | Type in search → filtered zones visible                           |
| UC-SZ-05  | Row click selects zone on map                | Emergency Services | Click row → map panel title updates → Show All resets view        |
| UC-GL-01  | View guidelines list                         | Reporter           | Page load → guideline titles visible                              |
| UC-GL-02  | Create guideline                             | Reporter           | Fill title/content → Submit → API called                          |
| UC-GL-04  | Search guidelines                            | Reporter           | Type in search → filtered                                         |
| UC-NAV-01 | Sidebar per role                             | All roles          | Sidebar items match role permissions                              |
| UC-NAV-02 | Header shows correct user info               | All roles          | Role badge in header matches logged-in role                       |
| UC-NAV-03 | Sidebar link navigation                      | Reporter           | Click each sidebar item → URL changes                             |
| UC-ER-01  | Emergency request list renders               | Emergency Services | Page load → all requests with correct statuses                    |
| UC-ER-02  | Accept PENDING request                       | Emergency Services | Click Accept on PENDING row → API called                          |
| UC-ER-03  | Reject PENDING request                       | Emergency Services | Click Reject on PENDING row → API called                          |
| UC-ER-04  | Filter requests by status                    | Emergency Services | Select status filter → filtered list                              |

---

## 4. Data Flow Tested

```
User Action (UI) → Service Function → Axios Interceptor → API Endpoint
                                      (mocked in Cypress)
```

Each API mock is defined via `cy.intercept()` in `cypress/support/commands.ts` and aliased for `cy.wait()` assertions.

| API Call                              | Alias                    | Method | Endpoint                                            |
|---------------------------------------|--------------------------|--------|-----------------------------------------------------|
| List crime reports                    | `@getCrimeReports`       | GET    | `/report-manager/crime-reports`                     |
| Create crime report                   | `@createCrimeReport`     | POST   | `/report-manager/crime-reports`                     |
| Publish crime report                  | `@publishCrimeReport`    | POST   | `/report-manager/crime-reports/:id/publish`         |
| Delete crime report                   | `@deleteCrimeReport`     | DELETE | `/report-manager/crime-reports/:id`                 |
| List missing persons                  | `@getMissingPersons`     | GET    | `/report-manager/missing-person-reports`            |
| Create missing person                 | `@createMissingPerson`   | POST   | `/report-manager/missing-person-reports`            |
| Publish missing person                | `@publishMissingPerson`  | POST   | `/report-manager/missing-person-reports/:id/publish`|
| Delete missing person                 | `@deleteMissingPerson`   | DELETE | `/report-manager/missing-person-reports/:id`        |
| List safe zones                       | `@getSafeZones`          | GET    | `/safe-zone-manager/zones`                          |
| Create safe zone                      | `@createSafeZone`        | POST   | `/safe-zone-manager/zones`                          |
| Delete safe zone                      | `@deleteSafeZone`        | DELETE | `/safe-zone-manager/zones/:id`                      |
| List emergency requests               | `@getEmergencyRequests`  | GET    | `/emergency-request-manager/requests`               |
| Accept emergency request              | `@acceptEmergencyRequest`| POST   | `/emergency-request-manager/requests/:id/accept`    |
| Reject emergency request              | `@rejectEmergencyRequest`| POST   | `/emergency-request-manager/requests/:id/reject`    |
| List guidelines                       | `@getGuidelines`         | GET    | `/report-manager/guidelines`                        |
| Create guideline                      | `@createGuideline`       | POST   | `/report-manager/guidelines`                        |

---

## 5. File Structure

```
cypress/
├── e2e/
│   ├── auth/
│   │   └── login.cy.ts               # UC-01 – UC-05, ECP (auth state)
│   ├── crime-reports/
│   │   ├── crime-report-form.cy.ts   # BVA, ECP, UC-CR-01 – UC-CR-04
│   │   └── crime-reports-list.cy.ts  # UC-CRL-01 – UC-CRL-04, DT (roles)
│   ├── missing-persons/
│   │   ├── missing-person-form.cy.ts # BVA, ECP, UC-MP-01, UC-MP-03 – UC-MP-04
│   │   └── missing-persons-list.cy.ts# UC-MPL-01 – UC-MPL-03, DT (status × actions)
│   ├── safe-zones/
│   │   └── safe-zones.cy.ts          # BVA, ECP, DT (role × access), UC-SZ-01 – UC-SZ-05
│   ├── emergency/
│   │   └── emergency-requests.cy.ts  # DT (role × access, status × actions), UC-ER-01 – UC-ER-04, ECP
│   ├── guidelines/
│   │   └── guidelines.cy.ts          # BVA, ECP, DT, UC-GL-01 – UC-GL-04
│   └── navigation/
│       └── rbac.cy.ts                # DT (role × route, sidebar), UC-NAV-01 – UC-NAV-03
├── fixtures/
│   ├── crime-reports.json
│   ├── missing-persons.json
│   ├── safe-zones.json
│   ├── emergency-requests.json
│   └── guidelines.json
└── support/
    ├── commands.ts                   # Custom commands: loginAs, visitAsRole, mock* helpers
    └── e2e.ts                        # Global setup, uncaught exception suppression
```

---

## 6. Test Environment & Setup

### Prerequisites
```bash
# Install dependencies (Cypress added as devDependency)
npm install

# Start the Next.js dev server
npm run dev

# Open Cypress UI (interactive)
npm run cypress:open

# Run all tests headlessly
npm run cypress:run:headless
```

### Auth Strategy
Since Keycloak requires an external server, tests bypass it by injecting auth state directly into `localStorage` via `cy.visitAsRole(path, role)` and `cy.loginAs(role)`. This sets:

| localStorage Key | Value                                |
|------------------|--------------------------------------|
| `auth_user`      | JSON user object with role           |
| `access_token`   | `mock-access-token-for-testing`      |
| `refresh_token`  | `mock-refresh-token-for-testing`     |
| `token_type`     | `Bearer`                             |
| `user_role`      | Role in lowercase (e.g. `reporter`)  |

### API Mocking Strategy
All backend API calls are intercepted using `cy.intercept()`. Fixtures provide realistic test data. Mock intercepts are set up in the `cypress/support/commands.ts` custom commands (e.g. `cy.mockCriminalReportsApi()`).

---

## 7. Test Count Summary

| Spec File                    | Tests | Techniques Used           |
|------------------------------|-------|---------------------------|
| auth/login.cy.ts             | 16    | UC, ECP, DT               |
| crime-reports/form.cy.ts     | 24    | BVA, ECP, UC              |
| crime-reports/list.cy.ts     | 13    | UC, ECP, DT               |
| missing-persons/form.cy.ts   | 26    | BVA, ECP, UC              |
| missing-persons/list.cy.ts   | 14    | UC, ECP, DT               |
| safe-zones/safe-zones.cy.ts  | 27    | BVA, ECP, DT, UC          |
| emergency/emergency-req.cy.ts| 18    | DT, UC, ECP               |
| guidelines/guidelines.cy.ts  | 11    | BVA, ECP, DT, UC          |
| navigation/rbac.cy.ts        | 18    | DT, UC                    |
| **Total**                    | **167**| All 4 techniques         |

---

## 8. Known Limitations & Notes

1. **Leaflet/Map components** (`LocationPicker`, `MapView`) are dynamically imported with SSR disabled. Cypress intercepts may see "Loading map…" during SSR; tests avoid asserting on map internals.
2. **Debounced search** inputs use a 300 ms debounce. If tests are flaky, add `cy.wait(400)` after typing in search fields.
3. **Toast messages** (via `sonner`) render in a portal. Assert with `cy.contains()` at the `body` level rather than inside a specific container.
4. **Keycloak redirect** on the login page is NOT tested end-to-end (requires a live Keycloak instance). The redirect button's existence and clickability is asserted instead.
5. **Role persistence**: The `auth_user` object in localStorage drives the `AuthContext`. If the `AuthContext` reads from an API rather than localStorage in production, the mock strategy will need updating.
