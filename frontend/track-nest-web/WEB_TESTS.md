# TrackNest Web — Test Case Document

## Test Infrastructure

- **Framework**: Jest + React Testing Library (`jsdom` environment)
- **Test directories**: `test/` (page-level), `__tests__/` (use-case-driven)
- **Run all tests**: `npm test`
- **Run specific file**: `npx jest --testPathPattern=<pattern> --no-coverage`

## Accounts Required

| Role | Realm | Purpose |
|---|---|---|
| Reporter | `public-dev` | Crime reports, missing persons, guidelines |
| Emergency Service | `restricted-dev` | Emergency requests, safe zones |
| Admin | `restricted-dev` | Accounts management, admin emergency view |

---

## TC-AUTH: Authentication

| ID | Description | Preconditions | Steps | Expected |
|---|---|---|---|---|
| AUTH-01 | Landing page loads without login | None | Navigate to `/` | Page renders with sign-in CTA |
| AUTH-02 | Keycloak redirect on sign-in | None | Click "Sign in with Keycloak" | Redirect to Keycloak login page |
| AUTH-03 | Successful login redirects to dashboard | Valid credentials | Complete Keycloak login | Redirect to `/dashboard` |
| AUTH-04 | Unauthenticated access to dashboard redirects | None | Navigate to `/dashboard` directly | Redirect to `/login` |
| AUTH-05 | Sidebar shows correct items per role | Logged in as each role | Observe sidebar | Reporter: Crime/Missing/Guidelines; ES: Emergency/Safe Zones; Admin: Accounts/Emergency Admin |

---

## TC-DASH: Dashboard Overview

| ID | Description | Preconditions | Steps | Expected |
|---|---|---|---|---|
| DASH-01 | Dashboard loads statistics | Any authenticated user | Navigate to `/dashboard` | Crime/missing/guidelines counts visible |
| DASH-02 | Charts render correctly | Reporter role | Navigate to `/dashboard` | Weekly trend, severity, status charts visible |

---

## TC-CR: Crime Reports

### List Page (`/dashboard/crime-reports`)

| ID | Description | Preconditions | Steps | Expected |
|---|---|---|---|---|
| CR-01 | List loads 10 reports per page | Reporter | Navigate to list | 10 items visible, pagination controls present |
| CR-02 | Severity filter — High (≥4) | Reporter, reports with varied severity | Click "High Priority" tab | Only severity ≥4 reports shown |
| CR-03 | Severity filter — Medium (=3) | Reporter | Click "Medium" tab | Only severity 3 reports shown |
| CR-04 | Severity filter — Low (≤2) | Reporter | Click "Low" tab | Only severity ≤2 reports shown |
| CR-05 | Title search (debounced) | Reporter | Type in search box, wait 400ms | Filtered results from backend |
| CR-06 | Pagination — next page | Reporter, >10 reports | Click next page button | Next 10 reports load |
| CR-07 | Pagination — page numbers | Reporter, >10 reports | Click page number | Correct page loads |
| CR-08 | Publish report | Reporter, unpublished report | Click Publish → confirm | Report status → public |
| CR-09 | Delete report | Reporter | Click Delete → confirm | Report removed from list |
| CR-10 | Heatmap view toggle | Reporter | Click "Heatmap" button | Heatmap view renders |
| CR-11 | Showing X–Y of Z entries text | Reporter | Load any page | Correct range and total displayed |

### Create Page (`/dashboard/crime-reports/create`)

| ID | Description | Preconditions | Steps | Expected |
|---|---|---|---|---|
| CR-12 | Create report with all required fields | Reporter | Fill form, select map location, submit | Redirect to list, report appears |
| CR-13 | Validation — missing required fields | Reporter | Submit empty form | Validation errors shown |
| CR-14 | Photo upload | Reporter | Attach photo file, submit | Report created with photo |

### Detail Page (`/dashboard/crime-reports/[id]`)

| ID | Description | Preconditions | Steps | Expected |
|---|---|---|---|---|
| CR-15 | Detail shows correct data | Reporter | Click report row | Title, severity, content, map visible |
| CR-16 | Publish from detail | Reporter, draft report | Click Publish | Status → public, button disappears |
| CR-17 | Navigate to edit | Reporter | Click Edit button | Redirect to edit page |

### Edit Page (`/dashboard/crime-reports/[id]/edit`)

| ID | Description | Preconditions | Steps | Expected |
|---|---|---|---|---|
| CR-18 | Form pre-fills with existing data | Reporter | Navigate to edit | All fields filled with current values |
| CR-19 | Save changes | Reporter | Modify fields, save | Redirect to detail, updated data shown |

---

## TC-MP: Missing Persons

### List Page (`/dashboard/missing-persons`)

| ID | Description | Preconditions | Steps | Expected |
|---|---|---|---|---|
| MP-01 | List loads with pagination | Reporter | Navigate to list | Reports visible |
| MP-02 | Filter by status (Pending/Published/Rejected) | Reporter | Select status filter | Only matching reports shown |
| MP-03 | Search by name | Reporter | Type in search box | Filtered by name |
| MP-04 | Publish report | Reporter, pending report | Click Publish → confirm | Status → PUBLISHED |
| MP-05 | Delete report | Reporter | Click Delete → confirm | Report removed |

### Create/Detail/Edit

| ID | Description | Steps | Expected |
|---|---|---|---|
| MP-06 | Create with photo upload | Fill form, upload photo, submit | Report in list with photo |
| MP-07 | Location picker on map | Click map location | Coordinates auto-filled |
| MP-08 | Detail view shows photo and map | Open report | Photo and location map visible |
| MP-09 | Edit pre-fills form | Navigate to edit | All fields populated |

---

## TC-GL: Guidelines

### List Page (`/dashboard/guidelines`)

| ID | Description | Preconditions | Steps | Expected |
|---|---|---|---|---|
| GL-01 | List loads with 10 items/page | Reporter | Navigate to list | Cards visible, pagination present |
| GL-02 | All Guides tab — no isPublic filter | Reporter | Click "All Guides" | API called with `isPublic=undefined` |
| GL-03 | Published tab — only public | Reporter | Click "Published" | API called with `isPublic=true`; only published cards shown |
| GL-04 | Drafts tab — only drafts | Reporter | Click "Drafts" | API called with `isPublic=false`; only draft cards shown |
| GL-05 | Search by title | Reporter | Type in search box | Server-side filter triggered |
| GL-06 | Draft card shows "Continue" button | Reporter, draft guideline | Load list | "Continue" text visible on draft card |
| GL-07 | Published card shows View + Edit buttons | Reporter, published guideline | Load list | Eye and Edit (FileText) icons visible |
| GL-08 | Navigate to detail via Continue | Reporter | Click "Continue" on draft | Redirect to `/dashboard/guidelines/[id]` |
| GL-09 | Navigate to detail via View | Reporter | Click Eye icon on published | Redirect to `/dashboard/guidelines/[id]` |
| GL-10 | Navigate to edit via Edit | Reporter | Click FileText icon | Redirect to `/dashboard/guidelines/[id]/edit` |
| GL-11 | Delete guideline | Reporter | Click ⋮ → confirm dialog → Confirm | Guideline removed; list refreshed |
| GL-12 | Cancel delete | Reporter | Click ⋮ → Cancel | Modal closes; guideline remains |
| GL-13 | Empty state message | Reporter, no guidelines | Load list | "No guidelines found in this section" shown |
| GL-14 | Pagination — Showing X–Y of Z | Reporter, >10 guidelines | Load list | Correct range text |

### Create Page (`/dashboard/guidelines/create`)

| ID | Description | Steps | Expected |
|---|---|---|---|
| GL-15 | Form renders with all fields | Navigate to create | Title, Abstract, Content (RichText) visible |
| GL-16 | Cancel navigates back | Click Cancel | `router.back()` called |
| GL-17 | Preview mode shows entered content | Fill form, click Preview | Preview shows title and abstract |
| GL-18 | Publish from preview | Complete preview, click "Publish Guideline" | `createGuidelinesDocument` + `publishGuidelinesDocument` called; redirect to list |
| GL-19 | Save as Draft from preview | Complete preview, click "Save as Draft" | `createGuidelinesDocument` called; `publishGuidelinesDocument` NOT called; redirect to list |
| GL-20 | Back to Edit from preview | Click "Back to Edit" | Form re-appears with previous content |

### Detail Page (`/dashboard/guidelines/[id]`)

| ID | Description | Steps | Expected |
|---|---|---|---|
| GL-21 | Renders HTML content | Open a guideline with HTML content | Content rendered as HTML |
| GL-22 | Renders iframe for URL content | Open guideline with URL content | `<iframe>` tag visible |
| GL-23 | Chatbot panel visible | Open any guideline | Chatbot panel renders |
| GL-24 | Publish button visible for drafts | Open unpublished guideline | "Publish Guideline" button visible |
| GL-25 | Publish calls service | Click "Publish Guideline" | `publishGuidelinesDocument` called |
| GL-26 | Delete and navigate | Click Delete → confirm | `deleteGuidelinesDocument` called; redirect to list |
| GL-27 | Not Found state | Open non-existent guideline | "Guideline Not Found" message |

---

## TC-ER: Emergency Requests (Emergency Service)

### List Page (`/dashboard/emergency-requests`)

| ID | Description | Preconditions | Steps | Expected |
|---|---|---|---|---|
| ER-01 | Access denied for non-ES users | Reporter role | Navigate to page | "Access Denied" shown |
| ER-02 | List loads for ES users | Emergency Service role | Navigate to page | Table with requests visible |
| ER-03 | PENDING row has Accept + Reject buttons | ES, PENDING request | Load list | Accept (✓) and Reject (✗) icons visible |
| ER-04 | ACCEPTED row has Close button | ES, ACCEPTED request | Load list | Close (✓) icon visible; no Accept/Reject |
| ER-05 | Accept request — success | ES, PENDING request | Click Accept | `acceptEmergencyRequest` called; row → ACCEPTED |
| ER-06 | Reject request — requires reason | ES, PENDING request | Click Reject; submit empty | Confirm button disabled |
| ER-07 | Reject request — with reason | ES | Click Reject; enter reason; confirm | `rejectEmergencyRequest` called; row → REJECTED |
| ER-08 | Close request — requires note | ES, ACCEPTED request | Click Close; submit empty | Confirm button disabled |
| ER-09 | Close request — with note | ES | Click Close; enter note; confirm | `closeEmergencyRequest` called; row → CLOSED |
| ER-10 | Filter by status | ES | Change status dropdown | `getEmergencyRequests` called with status param |
| ER-11 | Search by ID | ES | Type in search box | Rows filtered by ID |
| ER-12 | Navigate to detail | ES | Click request ID link | Stored in sessionStorage; redirect to detail |

### Detail Page (`/dashboard/emergency-requests/[id]`)

| ID | Description | Steps | Expected |
|---|---|---|---|
| ER-13 | Renders sender and target profiles | Open detail from ES list | Sender profile and Target profile cards visible |
| ER-14 | Location map renders | Open detail | Map view with target coordinates |
| ER-15 | Back button returns to ES list | Click Back | Redirect to `/dashboard/emergency-requests` |
| ER-16 | Not Found when no sessionStorage | Navigate directly to detail URL | "Request not found" message |

---

## TC-ERA: Emergency Requests (Admin)

### Admin List Page (`/dashboard/emergency-requests/admin`)

| ID | Description | Preconditions | Steps | Expected |
|---|---|---|---|---|
| ERA-01 | Access denied for non-Admin users | Reporter role | Navigate to page | "Access Denied" shown |
| ERA-02 | List loads all requests | Admin role | Navigate to page | All requests visible (not filtered by service) |
| ERA-03 | Assigned Service column visible | Admin | Load list | Service username and email shown per row |
| ERA-04 | No Accept/Reject/Close buttons | Admin | Load list | Action buttons absent (read-only) |
| ERA-05 | Filter by status | Admin | Change status dropdown | `getAllEmergencyRequests` called with status |
| ERA-06 | Search by ID | Admin | Type in search box | Rows filtered |
| ERA-07 | Navigate to detail with ?from=admin | Admin | Click request ID | Redirect to `/dashboard/emergency-requests/[id]?from=admin` |
| ERA-08 | Empty state shown when no results | Admin, no requests | Load list | "No results" message |

### Detail (from Admin)

| ID | Description | Steps | Expected |
|---|---|---|---|
| ERA-09 | Back button returns to admin list | Open detail from admin list | Back → `/dashboard/emergency-requests/admin` |

---

## TC-SZ: Safe Zones

| ID | Description | Preconditions | Steps | Expected |
|---|---|---|---|---|
| SZ-01 | List loads with map | Emergency Service | Navigate to `/dashboard/safe-zones` | Safe zones on map and in list |
| SZ-02 | Create safe zone | ES | Fill name/coordinates/radius, submit | Zone appears in map and list |
| SZ-03 | Delete safe zone | ES | Click Delete → confirm | Zone removed from map and list |
| SZ-04 | Search by name | ES | Type in search box | Filtered results |

---

## TC-ACC: Accounts (Admin)

| ID | Description | Preconditions | Steps | Expected |
|---|---|---|---|---|
| ACC-01 | List loads all accounts | Admin | Navigate to `/dashboard/accounts` | User list visible |
| ACC-02 | Filter by role | Admin | Select role dropdown | Only matching role shown |
| ACC-03 | Filter by status | Admin | Select status dropdown | Active or Banned filtered |
| ACC-04 | Search by name/email | Admin | Type in search | Matching accounts shown |
| ACC-05 | Ban account | Admin | Click Ban → confirm | Account status → Banned |
| ACC-06 | Unban account | Admin | Click Unban → confirm | Account status → Active |
| ACC-07 | Delete account | Admin | Click Delete → confirm | Account removed from list |

---

## Jest Test Coverage Summary

| File | Page(s) Tested | Tests |
|---|---|---|
| `test/guidelines-pages.test.tsx` | `/guidelines`, `/guidelines/[id]`, `/guidelines/create` | ~35 |
| `test/emergency-requests-pages.test.tsx` | `/emergency-requests` (ES), `/emergency-requests/[id]` | ~18 |
| `test/admin-emergency-requests-pages.test.tsx` | `/emergency-requests/admin` | ~15 |
| `test/crime-reports-pages.test.tsx` | `/crime-reports`, `/crime-reports/[id]`, `/crime-reports/create` | ~35 |
| `test/missing-persons-pages.test.tsx` | `/missing-persons`, `/missing-persons/[id]`, `/missing-persons/create` | ~30 |
| `test/safe-zones-page.test.tsx` | `/safe-zones` | ~12 |
| `test/accounts.test.tsx` | `/accounts`, `/accounts/[id]` | ~15 |
| `__tests__/app/emergency-requests/EmergencyRequestsPage.test.tsx` | `/emergency-requests` — UC-02, UC-03, UC-04 | 5 |

### Run specific suites
```bash
# All tests
npm test

# Guidelines only
npx jest --testPathPattern=guidelines --no-coverage

# Emergency requests (ES + Admin)
npx jest --testPathPattern=emergency-requests --no-coverage

# New admin page only
npx jest --testPathPattern=admin-emergency-requests --no-coverage
```
