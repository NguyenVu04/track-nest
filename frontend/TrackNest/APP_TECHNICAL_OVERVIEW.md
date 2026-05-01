# TrackNest Mobile App - Technical Structure and Feature Inventory

Generated from source code inspection on 2026-04-19.
Scope: current workspace state under `d:/tracknest-mobile`.

## 1. Technology Stack

- Framework: Expo + React Native + Expo Router
- Language: TypeScript (`strict: true`)
- Routing: file-based routing (`expo-router`)
- State model: React Context + custom hooks
- Map: `react-native-maps` with Google provider
- Auth: Keycloak OIDC (`expo-auth-session`, PKCE)
- Networking:
  - gRPC-web for tracker, tracking-manager, notifier domains
  - REST (axios) for emergency, criminal reports, file upload domains
- Push and local notifications: `expo-notifications` + Firebase setup
- Background execution:
  - `expo-task-manager`
  - `expo-background-task`
  - native Android foreground services for location/crash
- Native Android modules: Kotlin modules for location, crash detection, distraction tracking
- Protobuf/gRPC codegen: generated files under `proto/`

Reference files:

- `package.json`
- `app.json`
- `tsconfig.json`
- `buf.gen.yaml`

## 2. High-Level Runtime Architecture

App boot path:

1. `app/index.tsx` requests location permissions, registers background upload task, sets upload notification channel, then redirects by auth state.
2. `app/_layout.tsx` mounts provider tree and initializes cross-cutting hooks (`useDrivingMode`, `useDistractionTracker`, background task definitions import).
3. `app/(app)/_layout.tsx` enforces auth/guest gating, initializes push notifications and voice SOS activation, and registers all stack screens.
4. `app/(app)/(tabs)/_layout.tsx` renders bottom tabs (Map, Reports, Settings + dev-only test tabs).

Provider tree order (important for dependencies):

- AuthProvider
- DevModeProvider
- LanguageProvider
- ProfileProvider
- SettingsProvider
- TrackingProvider
- EmergencyProvider
- ReportsProvider
- POIAnalyticsProvider
- MapProvider

## 3. Folder Responsibilities

- `app/`: routes/screens (auth, tab screens, stack screens)
- `components/`: reusable UI and bottom sheets
- `contexts/`: app-level state domains
- `hooks/`: reusable behavioral logic (location, streaming, notifications, voice, driving)
- `services/`: API/data access layer (gRPC-web + REST adapters)
- `utils/`: low-level helpers (auth metadata, storage, service URLs, notification helpers)
- `constant/`: keys, type aliases, i18n dictionaries, mock helpers
- `proto/`: `.proto` sources + generated JS/TS stubs
- `android/`: native Android application, services, permissions, build config
- Docs currently present:
  - `README.md` (generic Expo starter doc)
  - `MOBILE_APP_DOCS.md` (product/feature doc)
  - `IMPLEMENTATION_PLAN.md` (roadmap/plan doc)
  - `FCM_FLOW.md` (notification flow doc)

## 4. Navigation Structure

### 4.1 Root and Auth

- Entry route: `app/index.tsx`
- Auth route group in active flow: `app/(auth)/login.tsx`
- Also present (duplicate/legacy auth path):
  - `app/auth/login.tsx`
  - `app/auth/_layout.tsx`

### 4.2 Main Stack (`app/(app)/_layout.tsx`)

Registered stack screens:

- `(tabs)`
- `family-circles/new`
- `location-history`
- `manage-trackers`
- `safe-zones`
- `crime-heatmap`
- `crime-dashboard`
- `crime-analysis`
- `missing-detail`
- `report-detail`
- `create-report`
- `create-missing`
- `sos` (gesture/animation/back behavior locked down)

### 4.3 Tab Layout (`app/(app)/(tabs)/_layout.tsx`)

Always visible tabs:

- `map`
- `reports`
- `settings`

Dev-only tabs (visible when `devMode || __DEV__`):

- `tracker-test`
- `tracking-manager-test`
- `notifier-test`
- `notification-test`
- `voice-test`

## 5. Core Features Implemented

### 5.1 Authentication and Session

- OAuth2/OIDC login with Keycloak discovery endpoints.
- Token persistence and refresh logic with expiry buffering.
- Guest mode support (`continueAsGuest`).
- Controlled logout clears tokens and stops background location/upload tasks.

Sources:

- `contexts/AuthContext.tsx`
- `app/(auth)/login.tsx`

### 5.2 Real-Time Location Tracking

- Device location captured and surfaced by `useDeviceLocation`.
- Android path prefers native foreground location service (`NativeLocationService`) with buffered samples.
- Samples are merged into:
  - latest location
  - upload queue
  - location history
    including dwell time (`time_spent`) logic.
- Upload pipeline sends queued points to backend (`updateUserLocation`) and handles network/auth pause states.

Sources:

- `hooks/useDeviceLocation.ts`
- `utils/backgroundLocation.ts`
- `utils/locationMerge.ts`
- `services/locationUpload.ts`
- `services/tracker.ts`
- `services/backgroundTasks.ts`

### 5.3 Family Circles and Members

- List/create/update/delete family circles.
- Join via OTP participation permission.
- List members, assign admin, remove member, leave circle.
- Selected circle persistence in local storage and cache fallback.

Sources:

- `services/trackingManager.ts`
- `hooks/useFamilyCircle.ts`
- `app/(app)/family-circles/new.tsx`
- `app/(app)/manage-trackers.tsx`

### 5.4 Map Experience

- Main map includes:
  - user marker and follower markers
  - safe zone circles + markers
  - POI markers
  - crime heatmap circles
- Follower stream source:
  - primary: gRPC stream (`useStreamedFollowers`)
  - fallback: mock followers for selected circle
- Header provides family circle selector + in-app notifications modal.
- Controls provide center action, heatmap toggle, POI toggle, map-type picker, and SOS FAB.

Sources:

- `app/(app)/(tabs)/map.tsx`
- `components/MapHeader.tsx`
- `components/MapControls.tsx`
- `hooks/useStreamedFollowers.ts`

### 5.5 Location History

- History screen with date and time filters.
- Map polyline and indexed markers.
- List and map synchronized selection.
- Reverse geocoding for selected points.

Sources:

- `app/(app)/location-history.tsx`
- `components/LocationHistoryViewer.tsx`

### 5.6 Emergency / SOS

- Dedicated SOS screen with countdown and swipe-to-cancel flow.
- Auto-activation support via route param (`autoActivate=true`).
- On trigger, sends emergency request with current GPS through Emergency service.
- Schedules local status notifications for success/failure/cancel.

Sources:

- `app/(app)/sos.tsx`
- `contexts/EmergencyContext.tsx`
- `services/emergency.ts`

### 5.7 Voice SOS Activation

- Continuous speech recognition hook active in app shell (when enabled).
- Trigger phrase matching routes user to SOS screen.
- Separate voice test screen available in dev tabs.

Sources:

- `hooks/useVoiceSosActivation.ts`
- `app/(app)/(tabs)/voice-test.tsx`
- `services/guardianSettings.ts`

### 5.8 Reports, Missing Persons, Crime Analytics

- Reports tab fetches paginated crime reports, missing persons, and guides.
- Create report supports multi-image selection and upload path.
- Create missing person supports profile photo and metadata.
- Detail pages for report and missing person.
- Dedicated screens for:
  - crime heatmap
  - dashboard summary
  - analysis report (date-range)

Sources:

- `app/(app)/(tabs)/reports.tsx`
- `app/(app)/create-report.tsx`
- `app/(app)/create-missing.tsx`
- `app/(app)/report-detail.tsx`
- `app/(app)/missing-detail.tsx`
- `app/(app)/crime-heatmap.tsx`
- `app/(app)/crime-dashboard.tsx`
- `app/(app)/crime-analysis.tsx`
- `services/criminalReports.ts`
- `services/reports.ts`
- `services/mediaUpload.ts`

### 5.9 Notifications

- Push registration lifecycle:
  - request permission
  - fetch native push token
  - register token to backend
  - refresh token listener
- In-app notification center with two tabs:
  - tracking notifications
  - risk notifications
    including count, delete single, delete batch, clear-all.

Sources:

- `hooks/usePushNotifications.ts`
- `hooks/useNotifications.ts`
- `services/notifier.ts`
- `utils/notifications.ts`
- `FCM_FLOW.md`

### 5.10 Settings and Privacy

Settings currently cover:

- tracking/share toggles
- language selection
- location + notification permissions status/actions
- profile and data export actions
- account delete request placeholder
- guardian and voice settings summary/actions
- privacy toggles persisted in local storage
- clear local cache and clear location history
- manual upload pending locations
- developer options (service URL override + dev mode)
- logout/login-from-guest flow

Source:

- `app/(app)/(tabs)/settings.tsx`

### 5.11 Localization

- Supported languages: `English` and `Vietnamese`
- Screen-level dictionary modules in `constant/languages/`
- Runtime translation via `useTranslation`

Sources:

- `contexts/LanguageContext.tsx`
- `contexts/languageStorage.ts`
- `hooks/useTranslation.ts`
- `constant/languages/index.ts`

## 6. State Context Inventory

- `AuthContext`: tokens, user, auth/guest status, refresh, logout
- `TrackingContext`: tracking on/off behavior, share location switch
- `MapContext`: map type preference persistence
- `EmergencyContext`: active emergency + create/get nearest safe zones
- `ReportsContext`: reports/missing/guidelines fetch and mutate operations
- `ProfileContext`: profile + privacy settings + export/delete request APIs
- `SettingsContext`: guardian and voice settings persistence
- `POIAnalyticsContext`: POI list, heatmap points, risk level derivation
- `LanguageContext`: selected app language
- `DevModeContext`: dev mode toggle persisted to storage

## 7. Hook Inventory (Behavioral)

- Location and motion:
  - `useDeviceLocation`
  - `useDeviceHeading`
  - `useDrivingMode`
  - `useDistractionTracker`
  - `useCrashDetection`
- Streaming and map:
  - `useStreamedFollowers`
  - `useFamilyCircle`
  - `useFollowers`
  - `useMapController`
  - `useAddressFromLocation`
- Notification and voice:
  - `usePushNotifications`
  - `useNotifications`
  - `useVoiceSosActivation`
- Utility:
  - `useTranslation`

## 8. Service Layer and Backend Contracts

### 8.1 gRPC-web backed services

- `services/tracker.ts`:
  - stream family member locations
  - list location history
  - update own location
- `services/trackingManager.ts`:
  - family circle and membership operations
- `services/notifier.ts`:
  - mobile device registration + notification list/count/delete/clear

Proto files:

- `proto/tracker.proto`
- `proto/trackingmanager.proto`
- `proto/notifier.proto`

### 8.2 REST/HTTP backed services

- `services/emergency.ts` (emergency requests, safe zones)
- `services/criminalReports.ts` (crime, missing, analytics)
- `services/mediaUpload.ts` (file upload endpoints)
- `services/poiAndAnalytics.ts` (POIs + heatmap/high-risk checks)

### 8.3 Local-storage backed domain services

- `services/profileSettings.ts`
- `services/guardianSettings.ts`

## 9. Native Android Integration

Native modules/packages:

- `NativeLocationModule` + `NativeLocationService`
- `CrashDetectionModule` + `CrashDetectionService`
- `DistractionTrackerModule` + `DistractionTrackerService`

Additional native integration:

- `SosWidgetProvider` app widget launching deep link to SOS
- service registration controlled in `AndroidManifest.xml`

Release behavior specific to distraction tracker:

- `BuildConfig.ENABLE_DISTRACTION_TRACKER = false` in release build type
- package registration guarded in `MainApplication.kt`
- release manifest removes `DistractionTrackerService`

Sources:

- `android/app/build.gradle`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/release/AndroidManifest.xml`
- `android/app/src/main/java/com/project/tracknest/MainApplication.kt`

## 10. Permissions and Sensitive Capabilities

Observed Android permissions and capabilities include:

- location: foreground + background
- foreground service/location service
- notifications
- microphone (voice SOS)
- internet
- vibration
- notification listener (distraction tracking; removed in release build)

Config sources:

- `app.json` (Expo-level permissions/plugins)
- `android/app/src/main/AndroidManifest.xml` (merged native permissions/services)

## 11. Build, Packaging, and Environment

Scripts in `package.json`:

- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run lint`
- `npm run proto-gen`

Android build notes:

- release currently signs with debug keystore in this repository setup
- Hermes enabled
- New architecture enabled (`newArchEnabled=true`)

EAS profiles exist for development, preview, and production in `eas.json`.

## 12. Current Documentation Alignment

- `README.md` is generic Expo starter text and does not describe current product architecture.
- `MOBILE_APP_DOCS.md` is broad and useful, but some details are partially stale versus code reality (for example, parts of backend transport assumptions and some UI flow details).
- `IMPLEMENTATION_PLAN.md` is planning-oriented; many planned items are now implemented in code.
- `FCM_FLOW.md` aligns well with current notifier/push architecture and is still valuable.

## 13. Notable Technical Observations

1. There are two auth route trees (`app/(auth)` and `app/auth`) with overlapping intent; one appears legacy/duplicate.
2. `components/Navigation/AnimatedFabMenu.tsx` exists but is not currently referenced.
3. Some domains are mixed between real backend calls and local/mock fallback behavior (for example follower rendering fallback on map).
4. The release build explicitly disables distraction-tracker native integration to reduce sensitive capability footprint.

## 14. Suggested Next Documentation Steps

If you want this file to become the single source of truth, next low-risk improvements are:

1. Add a route-to-screen matrix with UX ownership and API dependencies.
2. Add sequence diagrams for login, location upload, SOS trigger, and push receive.
3. Add a config matrix (`.env`, `app.json`, Gradle, runtime fallbacks) for each environment.
4. Remove or clearly mark legacy route/files to reduce ambiguity for new contributors.

- release currently signs with debug keystore in this repository setup
- Hermes enabled
- New architecture enabled (`newArchEnabled=true`)

EAS profiles exist for development, preview, and production in `eas.json`.

## 12. Current Documentation Alignment

- `README.md` is generic Expo starter text and does not describe current product architecture.
- `MOBILE_APP_DOCS.md` is broad and useful, but some details are partially stale versus code reality (for example, parts of backend transport assumptions and some UI flow details).
- `IMPLEMENTATION_PLAN.md` is planning-oriented; many planned items are now implemented in code.
- `FCM_FLOW.md` aligns well with current notifier/push architecture and is still valuable.

## 13. Notable Technical Observations

1. There are two auth route trees (`app/(auth)` and `app/auth`) with overlapping intent; one appears legacy/duplicate.
2. `components/Navigation/AnimatedFabMenu.tsx` exists but is not currently referenced.
3. Some domains are mixed between real backend calls and local/mock fallback behavior (for example follower rendering fallback on map).
4. The release build explicitly disables distraction-tracker native integration to reduce sensitive capability footprint.

## 14. Suggested Next Documentation Steps

If you want this file to become the single source of truth, next low-risk improvements are:

1. Add a route-to-screen matrix with UX ownership and API dependencies.
2. Add sequence diagrams for login, location upload, SOS trigger, and push receive.
3. Add a config matrix (`.env`, `app.json`, Gradle, runtime fallbacks) for each environment.
4. Remove or clearly mark legacy route/files to reduce ambiguity for new contributors.
