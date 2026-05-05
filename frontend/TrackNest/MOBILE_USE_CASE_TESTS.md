# TrackNest Mobile – Use Case Test Plan (Jest + React Native Testing Library)

This document maps every use case in [`MOBILE_USE_CASES.md`](./MOBILE_USE_CASES.md) to one or
more Jest tests. Tests run against React Native Testing Library in the `jest-expo` environment.

---

## 1. Conventions

| Concern | Approach |
|---|---|
| Test framework | Jest 30 (`jest-expo` preset), React Native jsdom-like environment |
| Component driver | `@testing-library/react-native` — `render`, `fireEvent`, `waitFor`, `act` |
| Hook driver | `renderHook` from `@testing-library/react-native` |
| Translations | `@/hooks/useTranslation` mocked per-suite; returns a plain object of stable English strings |
| Navigation | `expo-router` — `useRouter` / `usePathname` / `useLocalSearchParams` mocked |
| Services | Per-suite `jest.mock("@/services/...")` with `jest.fn()` handles |
| Native modules | `react-native-maps`, `expo-location`, `expo-notifications`, `expo-speech-recognition`, `@react-native-async-storage/async-storage` stubbed inline |
| Alert | `jest.spyOn(Alert, "alert")` — destructive button invoked manually |
| `showToast` | `@/utils` mocked to a `jest.fn()` spy |
| Console noise | Silenced globally in `jest.setup.js` |

Run all suites: `npm test`  
Run one suite: `npm test -- ManageTrackers`

---

## 2. Use Case → Test Mapping

### 2.1 Tracking Features

| ID | Use Case | Component/Hook under test | Test file |
|---|---|---|---|
| TRACK-UC-02 | Enable/Disable location sharing | `TrackingContext` | `__tests__/TrackingContext.test.tsx` |
| TRACK-UC-03 | Create Circle | `NewFamilyCircle` screen | `__tests__/NewFamilyCircle.test.tsx` |
| TRACK-UC-06 | Remove Member From Circle | `ManageTrackersScreen` | `__tests__/ManageTrackers.test.tsx` |
| TRACK-UC-00 | Track Targets (map) | _(deferred — §5)_ | — |
| TRACK-UC-01 | Mobility Anomaly Alerts | _(deferred — §5)_ | — |
| TRACK-UC-04 | Join Circle | _(deferred — §5)_ | — |
| TRACK-UC-05 | Leave Circle | _(deferred — §5)_ | — |
| TRACK-UC-07 | View Mobility History | _(deferred — §5)_ | — |

### 2.2 Report Features

| ID | Use Case | Component under test | Test file |
|---|---|---|---|
| REPORT-UC-00 | Submit Missing Person Report | `CreateMissingScreen` | `__tests__/CreateMissing.test.tsx` |
| REPORT-UC-04 | View Guideline Document | `ReportsScreen` (Guide tab) | `__tests__/ReportsScreen.test.tsx` |
| REPORT-UC-07 | View Missing Report | `ReportsScreen` (Missing tab) | `__tests__/ReportsScreen.test.tsx` |
| REPORT-UC-08 | View Crime Report | `ReportsScreen` (Crime tab) | `__tests__/ReportsScreen.test.tsx` |
| REPORT-UC-03 | Delete Submitted Report | _(deferred — §5)_ | — |
| REPORT-UC-12 | High-Risk Zone Alerts | _(deferred — §5)_ | — |

### 2.3 Emergency Features

| ID | Use Case | Component/Hook under test | Test file |
|---|---|---|---|
| EMERGENCY-UC-00 | Activate Emergency Alert (Button) | `SosScreen` | `__tests__/sos.test.tsx` |
| EMERGENCY-UC-01 | Activate Emergency Alert (Voice) | `useVoiceSosActivation` hook | `__tests__/useVoiceSosActivation.test.ts` |
| EMERGENCY-UC-07 | Find Safe Zone | `SafeZonesScreen` | `__tests__/SafeZonesScreen.test.tsx` |

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

## 4. Variables & Equivalence Classes

| Variable | Classes asserted |
|---|---|
| `shareLocation` | `true` ⇒ AsyncStorage set "true" · `false` ⇒ set "false" |
| Circle name input | empty ⇒ Next disabled / toast · non-empty ⇒ Next enabled |
| Alert destructive button | pressed ⇒ remove called · cancel ⇒ not called |
| Form step | step < 4 ⇒ Next button · step = 4 ⇒ Submit button |
| Required fields (createMissing) | empty ⇒ validation alert · filled ⇒ advances |
| `autoActivate` param | `"1"` ⇒ immediate emergency · absent ⇒ countdown |
| Voice transcript | matches phrase ⇒ navigate · no match ⇒ ignore · on /sos ⇒ ignore |
| Safe zone search | matches name ⇒ shown · no match ⇒ filtered |

---

## 5. Deferred / Out-of-scope

| Use Case | Reason deferred |
|---|---|
| TRACK-UC-00 (Map tracking) | `react-native-maps` real-time gRPC streaming + MapView interaction — Detox/Maestro E2E territory |
| TRACK-UC-01 (Anomaly alerts) | Background service + Kafka consumer — no synchronous testable surface |
| TRACK-UC-04 (Join Circle) | OTP PIN entry uses native keyboard; complex multi-modal flow |
| TRACK-UC-05 (Leave Circle) | No dedicated screen found; surface is embedded in manage-trackers settings |
| TRACK-UC-07 (Location history) | Date picker + react-native-maps — too many native dependencies |
| REPORT-UC-03 (Delete report) | Delete surface is context-menu / long-press on detail page; requires full detail screen mount |
| REPORT-UC-12 (High-risk alerts) | Background location + push notifications — requires device/Detox |

---

## 6. File Layout

```
__tests__/
├── sos.test.tsx                       # EMERGENCY-UC-00
├── useVoiceSosActivation.test.ts      # EMERGENCY-UC-01
├── TrackingContext.test.tsx           # TRACK-UC-02
├── NewFamilyCircle.test.tsx           # TRACK-UC-03
├── ManageTrackers.test.tsx            # TRACK-UC-06
├── ReportsScreen.test.tsx             # REPORT-UC-04, UC-07, UC-08
├── CreateMissing.test.tsx             # REPORT-UC-00
└── SafeZonesScreen.test.tsx           # EMERGENCY-UC-07
test/
└── login.test.tsx                     # LoginScreen (existing)
jest.config.js                         # jest-expo preset + setupFilesAfterEnv
jest.setup.js                          # ImportMetaRegistry mock + console silencing
```
