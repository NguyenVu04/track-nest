# TrackNest Mobile App — Feature & UI Documentation

> React Native (Expo) · iOS & Android · Version: see `app.json`

---

## Table of Contents

1. [Overview](#overview)
2. [Navigation Structure](#navigation-structure)
3. [Screens](#screens)
4. [Features](#features)
5. [Services & Backend Integration](#services--backend-integration)
6. [State Management (Contexts)](#state-management-contexts)
7. [Hooks](#hooks)
8. [Color Theme & Design System](#color-theme--design-system)
9. [Localization](#localization)
10. [Authentication](#authentication)
11. [Permissions](#permissions)

---

## Overview

**TrackNest** is a family-safety and location-tracking app. It lets family members share their real-time positions, report criminal incidents, activate emergency SOS, and receive risk-zone alerts. The app uses gRPC streaming for low-latency location updates and integrates with a Keycloak-secured backend.

---

## Navigation Structure

```
app/
├── _layout.tsx                  ← Root: all React Contexts + global state
├── (auth)/
│   └── login.tsx                ← Keycloak OAuth2 login / guest mode
└── (app)/
    ├── _layout.tsx              ← Auth guard + main Stack + BottomSheetModalProvider
    │   Stack screens:
    │   ├── (tabs)
    │   ├── family-circles/new
    │   ├── location-history
    │   ├── manage-trackers
    │   ├── safe-zones
    │   ├── crime-heatmap
    │   ├── crime-dashboard
    │   ├── crime-analysis
    │   ├── report-detail
    │   ├── create-report
    │   ├── missing-detail
    │   ├── create-missing
    │   ├── guideline-detail
    │   ├── notifications
    │   └── sos                  ← Gesture-disabled, animation-disabled
    └── (tabs)/
        ├── _layout.tsx          ← Tab bar (height 70px + safe area)
        ├── map.tsx              ← Tab 1 — Map
        ├── reports.tsx          ← Tab 2 — Reports
        ├── settings.tsx         ← Tab 3 — Settings
        └── [dev tabs]           ← Hidden unless devMode / __DEV__
            ├── tracker-test
            ├── tracking-manager-test
            ├── notifier-test
            ├── notification-test
            └── voice-test
```

---

## Screens

### Auth

| Screen | Route | Description |
|--------|-------|-------------|
| Login | `/auth/login` | Keycloak OAuth2 PKCE flow. Shows TrackNest logo, "Sign In" button, "Continue as Guest" option. |

---

### Main Tabs

#### Map (`/map`)
The primary screen. Full-screen Google Maps view with real-time overlays.

**Features on this screen:**
- Live location marker for the current user (with speed indicator and compass heading arrow)
- Family member markers that animate smoothly to new positions
- Family circle selector (bottom sheet) — switch between circles
- Crime heatmap overlay (toggled on/off)
- Safe zone circles overlay
- POI (Point of Interest) markers
- Location history trail for selected member
- SOS FAB button (floating action button)
- Follower info sheet — tap a marker to view member details
- "Me" info sheet — tap own marker for speed, address, dwell time
- Map type switcher — Standard / Satellite / Hybrid / Terrain
- Tracking toggle (start/stop sharing own location)
- Share location toggle

**Bottom Sheets on Map:**
| Sheet | Trigger |
|-------|---------|
| `FamilyCircleListSheet` | Tap circle selector in header |
| `FollowerInfoSheet` | Tap a family member marker |
| `GeneralFollowerInfoSheet` | Tap "view all" on member list |
| `MapTypesSheet` | Tap map type control button |
| `myInfoSheet` | Tap own current-location marker |

---

#### Reports (`/reports`)
Tabbed list with three categories: **Crime Reports**, **Missing Persons**, **Guidelines**.

**Features:**
- Paginated list with pull-to-refresh
- Severity badges (High / Medium / Low) with color coding
- Tap to navigate to detail screen
- Header buttons → Crime Dashboard, Crime Analysis
- Floating action button → Create Report / Create Missing report

---

#### Settings (`/settings`)
Scrollable settings page grouped into sections.

| Section | Items |
|---------|-------|
| **General** | Language selector, Manage family circles, Manage trackers |
| **Maps & Safety** | Location history, Safe zones, Crime heatmap |
| **Sync** | Upload pending location data |
| **Privacy & Developer** | Privacy settings, Developer options (devMode toggle, server URL) |
| **Support** | Help & FAQ (coming soon) |
| **Account** | Sign out |

---

### Stack Screens

#### Family Circle — Create New (`/family-circles/new`)
- Enter circle name
- Select your role in the circle (Parent, Child, Guardian, Grandparent, Spouse, Other)
- Generates and displays an invite code

#### Location History (`/location-history`)
- Map with polyline trail for selected family member
- Date/time range filter
- Timeline list below map

#### Manage Trackers (`/manage-trackers`)
- List of all family circle members
- Member detail: name, avatar, role, connection status
- Remove member action

#### Safe Zones (`/safe-zones`)
- Map view of all saved safe zones
- Each zone shown as a circle with name label
- List view with distance calculation from current location
- Search by zone name

#### Crime Heatmap (`/crime-heatmap`)
- Full-screen map with crime intensity overlay
- Severity-colored circles (High = red, Medium = orange, Low = green)
- Scrollable crime event list at bottom

#### Crime Dashboard (`/crime-dashboard`)
- Summary statistics: total crimes, active, investigating, resolved
- Missing person stats
- Weekly trend bar chart
- Severity breakdown
- Crime-by-type breakdown

#### Crime Analysis (`/crime-analysis`)
- Date range picker
- Trend graphs
- Crime hotspot map

#### Report Detail (`/report-detail`)
- Full crime report: title, severity, address, date/time, description
- Standardized embedded map view for location context
- Horizontal photo gallery
- Integrated AI Chatbot (`ChatbotPanel`) for contextual assistance
- "Call Police" button
- "Share" button

#### Create Report (`/create-report`)
- Title, description, severity picker (Low / Medium / High)
- Interactive map-based location picker (replacing manual input)
- Number of victims / offenders
- Arrested toggle
- Photo upload (up to 5 images, uploaded to MinIO)

#### Missing Detail (`/missing-detail`)
- Missing person: name, personal ID, description, last seen date
- Standardized embedded map view
- Photo
- Integrated AI Chatbot (`ChatbotPanel`) for contextual assistance

#### Create Missing (`/create-missing`)
- Full name, personal ID, description
- Date/time picker
- Interactive map-based location picker
- Photo upload

#### Guideline Detail (`/guideline-detail`)
- Displays safety guidelines and tips
- Integrated AI Chatbot (`ChatbotPanel`) for contextual questions

#### Notifications (`/notifications`)
- Dedicated, swipeable list of past notifications
- Replaces the previous modal interface
- Displays tracking, risk, and messaging alerts

#### SOS (`/sos`)
- Activates immediately on navigate
- 10-second countdown with swipe-to-cancel gesture
- After countdown: sends emergency request with current GPS coordinates
- Sends FCM notification to all family circle members
- Back button, gesture navigation, and animations are disabled on this screen

---

## Features

### Real-Time Location Tracking
- Device GPS streamed via `watchPositionAsync` (Expo Location) with `distanceInterval: 3m`, `timeInterval: 1000ms`, `Accuracy.BestForNavigation`
- Location uploaded to server via `updateUserLocation` (gRPC unary) when moved >11m or every 5s heartbeat
- Other members' locations received via `streamFamilyMemberLocations` (gRPC server-streaming)
- Markers animate smoothly (800ms) between position updates using `MarkerAnimated` + `AnimatedRegion`
- Unified, motion-aware bottom sheet (`FollowerInfoSheet`) centralizes follower tracking data, displaying real-time movement states (Stationary, Walking, Driving) and speed.

### Family Circles
- Create circles with a name and personal role
- Join via shareable invite code (with expiry)
- Each circle is a separate tracking group
- Admin can assign/change roles, remove members
- "Leave" or "Delete" circle (last member cannot leave)

### Emergency SOS
- One-tap SOS activates the SOS screen
- 10-second cancellation window
- On confirm: `createEmergencyRequest()` sends GPS + user identity to backend
- Family circle members receive FCM push notification
- Previous emergency can be dismissed/completed

### Voice SOS
- Background microphone listener for configurable trigger phrase
- Activates SOS flow without touching the phone
- Voice commands configurable per guardian
- Enabled/disabled via Settings → Guardian / Voice settings

### Safe Zones
- Emergency service locations stored as lat/lng + radius
- Displayed as circles on the map
- Nearest safe zones returned in emergency context
- Can filter by distance from current position

### Crime Intelligence & AI Assistant
- Crime reports submitted with: title, description, severity, location, victims, offenders, photos
- Missing person reports with personal ID, description, photo, date
- Heatmap visualization powered by the POIAnalytics context
- Backend criminal analyzer provides dashboard summaries and trend analysis
- **AI Chatbot Assistant**: Integrated `ChatbotPanel` on Report and Guideline detail screens to provide contextual assistance and answer queries.

### Driving Mode & Distraction Detection
- `useDrivingMode`: detects driving via accelerometer/GPS speed patterns
- `useDistractionTracker`: monitors phone usage during driving (screen activity, phone usage)
- Warnings/notifications on distraction events

### Push Notifications
- FCM (Firebase Cloud Messaging) integration via `expo-notifications`
- Registration token saved to backend on login
- Categories:
  - **Tracking notifications** — family member location events
  - **Risk notifications** — SOS, battery low, speeding alerts
  - **Messaging notifications** — push alerts for new chat messages
- Dedicated, swipeable Notifications screen for viewing and managing past alerts
- Tap on notification navigates to relevant screen
- In-app notifications also shown as banners

### Data Sync
- Background task (`expo-task-manager`) buffers location data during poor connectivity
- "Upload Pending" settings item triggers manual sync
- Locally buffered data uploaded in batch via `locationUpload` service

### Developer Mode
- Hidden by default; enabled via triple-tap on app version in settings (or via `devMode` toggle)
- Unlocks: tracker test, tracking manager test, notifier test, notification test, voice test tabs
- Server URL override field (useful for pointing to local dev backend)
- Debug logging

---

## Services & Backend Integration

| Service file | Backend | Purpose |
|---|---|---|
| `tracker.ts` | user-tracking (gRPC 8800) | Stream member locations, update own location, location history |
| `trackingManager.ts` | user-tracking (REST) | Family circle CRUD, member management, invite codes |
| `emergency.ts` | emergency-ops | SOS request creation, safe zone queries, responder coordination |
| `criminalReports.ts` | criminal-reports | Crime reports, missing persons, guidelines, heatmap, dashboard |
| `notifier.ts` | user-tracking notifier | Register FCM token, fetch tracking/risk notifications |
| `profileSettings.ts` | user service | User profile, privacy settings, data export, account deletion |
| `guardianSettings.ts` | user service | Guardian list, voice command settings |
| `mediaUpload.ts` | MinIO / object storage | Photo upload for crime reports and missing person reports |
| `locationUpload.ts` | user-tracking | Flush buffered GPS history to server |
| `backgroundTasks.ts` | expo-task-manager | Background location collection task |
| `poiAndAnalytics.ts` | criminal-reports | Crime heatmap data, POI nearby queries |
| `reports.ts` | criminal-reports (adapter) | Converts backend types to UI types for Reports tab |

**API base URL:** configured via `EXPO_PUBLIC_API_URL` env variable.
**gRPC base URL:** configured via `EXPO_PUBLIC_TRACKER_GRPC_URL` (port `:8800` in dev, `/grpc` path in prod).

---

## State Management (Contexts)

All contexts are mounted in `app/_layout.tsx` as nested providers.

| Context | Key state | Key actions |
|---------|-----------|-------------|
| **AuthContext** | `tokens`, `user`, `isAuthenticated`, `isGuestMode` | `saveTokens()`, `clearTokens()`, `continueAsGuest()`, `getValidAccessToken()`, `logout()` |
| **TrackingContext** | `tracking` (bool), `shareLocation` (bool) | `setTracking()`, `setShareLocation()` |
| **EmergencyContext** | `activeEmergency` | `createEmergencyRequest()`, `getNearestSafeZones()` |
| **MapContext** | `mapType` (standard/satellite/hybrid/terrain) | `setMapType()` |
| **ProfileContext** | `profile`, `privacySettings` | `loadProfile()`, `updateProfile()`, `updatePrivacySetting()`, `exportUserData()`, `requestAccountDeletion()` |
| **SettingsContext** | `guardians[]`, `voiceSettings` | `setVoiceEnabled()`, `toggleCommand()`, `addGuardian()`, `removeGuardian()` |
| **ReportsContext** | `crimeReports[]`, `missingPersonReports[]`, `guidelines[]` | `fetchCrimeReports()`, `createCrimeReport()`, `fetchMissingPersonReports()` |
| **LanguageContext** | `language` ("vi" \| "en") | `setLanguage()` — persisted to AsyncStorage |
| **POIAnalyticsContext** | `crimeHeatmapPoints`, `nearbyPOIs` | `loadCrimeHeatmap()`, `getPOIColor()` |
| **DevModeContext** | `devMode` (bool) | `setDevMode()` |

---

## Hooks

| Hook | File | Description |
|------|------|-------------|
| `useDeviceLocation` | `hooks/useDeviceLocation.ts` | Streams GPS via `watchPositionAsync`. Returns `{ location, error }`. Activates background tracking when `tracking=true`. |
| `useStreamedFollowers` | `hooks/useStreamedFollowers.ts` | Opens gRPC server stream for family member locations. Auto-coalesces updates via rAF. Returns `{ followers, isStreaming, error }`. |
| `useMapController` | `hooks/useMapController.ts` | Manages `MapView` ref. Provides `centerMap(lat, lng)`, `fitToCoords()`. |
| `useFamilyCircle` | `hooks/useFamilyCircle.ts` | Fetches and persists selected family circle. Returns `{ circles, selectedCircle, selectCircle, refreshCircles }`. |
| `useFollowers` | `hooks/useFollowers.ts` | Wraps `followersToRender` list. Returns `{ selectedFollower, setSelectedFollowerId }`. |
| `useAddressFromLocation` | `hooks/useAddressFromLocation.ts` | Reverse-geocodes a lat/lng to a human-readable address string. |
| `useDeviceHeading` | `hooks/useDeviceHeading.ts` | Returns compass heading in degrees via device magnetometer. |
| `useDrivingMode` | `hooks/useDrivingMode.ts` | Detects driving state from accelerometer + GPS speed. |
| `useDistractionTracker` | `hooks/useDistractionTracker.ts` | Tracks phone usage events during driving mode. |
| `useCrashDetection` | `hooks/useCrashDetection.ts` | Monitors sudden deceleration events as crash indicator. |
| `usePushNotifications` | `hooks/usePushNotifications.ts` | Registers FCM token, handles foreground/background notification lifecycle. |
| `useNotifications` | `hooks/useNotifications.ts` | Local notification scheduling and management. |
| `useVoiceSosActivation` | `hooks/useVoiceSosActivation.ts` | Listens for configured voice phrase to trigger SOS. |
| `useMockFollowers` | `hooks/useMockFollowers.ts` | Generates mock Follower data for testing. |
| `useTranslation` | `hooks/useTranslation.ts` | Returns typed translation object for the active language. |

---

## Color Theme & Design System

Source: [`styles/styles.ts`](styles/styles.ts)

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#74becb` | Brand teal — buttons, active states, markers, links |
| `primaryDark` | `#5aa8b5` | Hover/pressed state, shadows |
| `primaryLight` | `#a8d8e0` | Teal highlights, light indicators |
| `primaryMuted` | `#e0f2f5` | Backgrounds, chips, light badges |
| `secondary` | `#5b9aa6` | Secondary actions |
| `accent` | `#4a8a96` | Accent elements |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `danger` | `#e74c3c` | Errors, SOS button, High-severity labels |
| `dangerLight` | `#fdeaea` | Danger backgrounds |
| `warn` | `#f39c12` | Warnings, Medium-severity labels |
| `warnLight` | `#fef5e7` | Warning backgrounds |
| `success` | `#27ae60` | Success states, Low-severity labels |
| `successLight` | `#e8f8ef` | Success backgrounds |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `textPrimary` | `#1a1a1a` | Body text, titles |
| `textSecondary` | `#6b7280` | Secondary labels, subtitles |
| `textMuted` | `#9ca3af` | Placeholders, disabled, inactive tab icons |
| `muted` | `#666` | Generic muted text |

### Surface & Background

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#ffffff` | Main screen background |
| `bgSecondary` | `#f8fafa` | Alternate section background |
| `surface` | `#f2f2f2` | Cards, input fields |
| `surfaceLight` | `#fafafa` | Subtle surfaces |
| `border` | `#e5e7eb` | Dividers, card borders |
| `borderLight` | `#f3f4f6` | Subtle separators (e.g., tab bar top border) |

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `spacing.xs` | `6px` | Icon gap, tight padding |
| `spacing.sm` | `8px` | Small padding, chip horizontal padding |
| `spacing.md` | `12px` | Standard padding |
| `spacing.lg` | `16px` | Section padding, card padding |
| `spacing.xl` | `24px` | Large section gaps |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radii.sm` | `8px` | Chips, small buttons |
| `radii.md` | `12px` | Cards, modals, standard buttons |
| `radii.lg` | `18px` | Large cards, bottom sheets |

### Shadows

```ts
shadows.small  = { shadowOpacity: 0.08, shadowRadius: 4,  elevation: 2  }
shadows.medium = { shadowOpacity: 0.12, shadowRadius: 6,  elevation: 4  }
```

### Crime Severity Color Mapping

| Severity | Color (stroke) | Fill |
|----------|---------------|------|
| High (≥4) | `#e74c3c` | `rgba(231, 76, 60, 0.3)` |
| Medium (≥2) | `#f39c12` | `rgba(243, 156, 18, 0.2)` |
| Low (<2) | `#27ae60` | `rgba(39, 174, 96, 0.15)` |

### Tab Bar

- Height: `70px` + `insets.bottom` (safe area)
- Active icon/label: `primary (#74becb)`
- Inactive: `textMuted (#9ca3af)`
- Background: `bg (#ffffff)`
- Top border: `borderLight (#f3f4f6)`, width `1px`
- Elevation: `12`, shadow color: `primaryDark`

---

## Localization

Two languages supported: **Vietnamese (`vi`)** and **English (`en`)**.

Language is persisted to AsyncStorage and applied globally via `LanguageContext`. All UI strings are defined in `constant/languages/` and accessed through the `useTranslation(langObject)` hook.

**To add a new language:**
1. Add entries to each language object in `constant/languages/`
2. Add the locale key to `LanguageContext` and the language picker in Settings

---

## Authentication

**Provider:** Keycloak (OAuth2 + PKCE)

| Setting | Value |
|---------|-------|
| Realm | `EXPO_PUBLIC_KEYCLOAK_REALM` |
| Client ID | `EXPO_PUBLIC_KEYCLOAK_CLIENT_ID` (default: `"mobile"`) |
| Redirect URI | `tracknest://` (custom scheme) |
| Scopes | `openid profile email offline_access` |
| Token storage | AsyncStorage (encrypted via expo-secure-store wrapper) |

**Flow:**
1. User taps "Sign In" → opens Keycloak in-app browser
2. Keycloak returns authorization code via redirect URI
3. App exchanges code for access + refresh tokens
4. Tokens stored; auto-refreshed on expiry
5. All API calls attach `Authorization: Bearer <access_token>` header

**Guest Mode:** Available in development. Skips authentication; some features disabled (creates/joins circles, uploads require auth).

---

## Permissions

| Permission | When requested | Used for |
|-----------|----------------|---------|
| `FOREGROUND_LOCATION` | On Map screen open | Real-time position on map |
| `BACKGROUND_LOCATION` | When tracking enabled | Background GPS collection even when app minimized |
| `PUSH_NOTIFICATIONS` | On first launch / Settings | FCM registration for SOS and tracking alerts |
| `MICROPHONE` | When voice SOS enabled | Voice command activation |
| `CAMERA` | When creating a report | Taking photos for crime/missing person reports |
| `MEDIA_LIBRARY` | When creating a report | Selecting existing photos |

Permission status is shown in **Settings → Privacy & Permissions**. Users can re-request denied permissions or open system settings directly from the app.
