# TrackNest — Mobile App ↔ Backend Services Integration Guide

## Architecture Overview

```
TrackNest Mobile App (React Native + Expo)
           │
           ├── gRPC-Web (Envoy proxy :8800)
           │        └── User Tracking Service  (Java/Spring Boot :8081)
           │
           ├── REST / Axios
           │        ├── Criminal Reports Service  (Java/Spring Boot :8082)
           │        └── Emergency Ops Service     (Java/Spring Boot :8083)
           │
           └── REST / Expo Auth Session
                    └── Keycloak (OAuth 2.0 / OIDC  :8080/auth)
```

---

## 1. Authentication Flow

### Login
1. Mobile launches Keycloak PKCE OAuth2 flow via `expo-auth-session`
2. User authenticates in browser (Keycloak realm `public-dev`)
3. Keycloak issues `code` → mobile exchanges for `accessToken`, `refreshToken`, `idToken`
4. Tokens stored in `AsyncStorage` with key `@TrackNest:tokens`
5. `AuthContext` exposes tokens to the rest of the app

### Per-Request Auth
All REST API calls must include:
```
Authorization: Bearer <accessToken>
```
**Criminal Reports** additionally requires for **all mutating endpoints** (POST / PUT / DELETE):
```
X-User-Id: <userUUID>   ← Keycloak subject (sub claim from JWT)
```
The user UUID must be decoded from the access token's `sub` field (`utils/auth.ts → getUserId()`).

### Token expiry
`getAuthMetadata()` checks `expiresAt - 60 s`. If expired, it throws `AuthUnavailableError` and the API call is silently skipped.

---

## 2. Criminal Reports Service Integration

**Base URL:** `EXPO_PUBLIC_CRIMINAL_URL` (e.g. `http://api.tracknestapp.org/criminal-reports`)

### Endpoints consumed by the mobile app

| Feature | Method | Path | Request | Response |
|---------|--------|------|---------|----------|
| Create crime report | POST | `/report-manager/crime-reports` | `{title, content, severity(1-5), date, longitude, latitude, numberOfVictims, numberOfOffenders, arrested}` + `X-User-Id` | `CrimeReportResponse` |
| Get crime report | GET | `/report-manager/crime-reports/{id}` | — + `X-User-Id` | `CrimeReportResponse` |
| Update crime report | PUT | `/report-manager/crime-reports/{id}` | `UpdateCrimeReportRequest` + `X-User-Id` | `CrimeReportResponse` |
| Publish crime report | POST | `/report-manager/crime-reports/{id}/publish` | — + `X-User-Id` | `CrimeReportResponse` |
| Delete crime report | DELETE | `/report-manager/crime-reports/{id}` | — + `X-User-Id` | `204` |
| List crime reports | GET | `/report-manager/crime-reports` | `?isPublic=true&minSeverity=N&page=0&size=20` | `PageResponse<CrimeReportResponse>` |
| Nearby crimes | GET | `/report-manager/crime-reports/nearby` | `?longitude=X&latitude=Y&radius=5000&page=0&size=20` | `PageResponse<CrimeReportResponse>` |
| Crime heatmap | GET | `/crime-locator/heatmap` | `?longitude=X&latitude=Y&radius=5000&page=0&size=50` | `PageResponse<CrimeReportResponse>` |
| High-risk check | GET | `/crime-locator/high-risk-check` | `?longitude=X&latitude=Y` | `Boolean` |
| Create missing person | POST | `/report-manager/missing-person-reports` | `{title, fullName, personalId, contactPhone, contactEmail, date, content, photo}` + `X-User-Id` | `MissingPersonReportResponse` |
| List missing persons | GET | `/report-manager/missing-person-reports` | `?isPublic=true&status=PUBLISHED&page=0&size=20` | `PageResponse<MissingPersonReportResponse>` |
| List guidelines | GET | `/report-manager/guidelines` | `?isPublic=true&page=0&size=20` | `PageResponse<GuidelinesDocumentResponse>` |

### `PageResponse` shape (criminal-reports service)
```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5,
  "first": true,
  "last": false
}
```

### Key constraint
`content` stores **plain text** (not a URL). Remove all `@URL` validations from entity fields (already fixed in service).

---

## 3. Emergency Ops Service Integration

**Base URL:** `EXPO_PUBLIC_EMERGENCY_URL` (e.g. `http://api.tracknest.org/emergency-ops`)

### Endpoints consumed by the mobile app

| Feature | Method | Path | Request | Response |
|---------|--------|------|---------|----------|
| Create emergency request | POST | `/emergency-request-receiver/request` | `{targetId, lastLatitudeDegrees, lastLongitudeDegrees}` | `{id, createdAtMs}` |
| My emergency requests | GET | `/emergency-request-receiver/requests` | `?page=0&size=20` | `PageResponse<TrackerEmergencyRequest>` |
| Count pending requests | GET | `/emergency-request-manager/requests/count` | `?status=PENDING` | `{count, timestampMs}` |
| List requests by status | GET | `/emergency-request-manager/requests` | `?status=PENDING&page=0&size=20` | `PageResponse<EmergencyRequest>` |
| Accept request | PATCH | `/emergency-request-manager/requests/{id}/accept` | — | `{id, acceptedAtMs}` |
| Reject request | PATCH | `/emergency-request-manager/requests/{id}/reject` | — | `{id, rejectedAtMs}` |
| Close request | PATCH | `/emergency-request-manager/requests/{id}/close` | — | `{id, closedAtMs}` |
| Update service location | PATCH | `/emergency-request-manager/emergency-service/location` | `{latitudeDegrees, longitudeDegrees}` | `{id, updatedAtMs}` |
| Nearest safe zones | GET | `/safe-zone-locator/safe-zones/nearest` | `?latitudeDegrees=Y&longitudeDegrees=X&maxDistanceMeters=5000&maxNumberOfSafeZones=10` | `GetNearestSafeZonesResponse[]` |
| Create safe zone | POST | `/safe-zone-manager/safe-zone` | `{name, latitudeDegrees, longitudeDegrees, radiusMeters}` | `{id, createdAtMs}` |
| List safe zones | GET | `/safe-zone-manager/safe-zones` | `?page=0&size=20` | `PageResponse<ServiceSafeZone>` |
| Update safe zone | PUT | `/safe-zone-manager/safe-zone/{id}` | `{name, latitudeDegrees, longitudeDegrees, radiusMeters}` | `{id, updatedAtMs}` |
| Delete safe zone | DELETE | `/safe-zone-manager/safe-zone/{id}` | — | `{id, deletedAtMs}` |

### `PageResponse` shape (emergency-ops service)
```json
{
  "items": [...],
  "totalItems": 100,
  "totalPages": 5,
  "currentPage": 0,
  "pageSize": 20
}
```

### `GetNearestSafeZonesResponse` shape
```json
{
  "safeZoneId": "uuid",
  "safeZoneName": "string",
  "latitudeDegrees": 10.77,
  "longitudeDegrees": 106.64,
  "radiusMeters": 500.0
}
```

---

## 4. User Tracking Service Integration (gRPC)

**Endpoint:** `EXPO_PUBLIC_SERVICE_URL` via Envoy proxy (port 8800)

All calls go through protobuf-generated clients defined in `proto/` directory.

| Feature | gRPC Method | Description |
|---------|------------|-------------|
| Stream family locations | `TrackingManager.StreamFamilyLocations` | Server-side stream of live follower positions |
| Upload my location | `Tracker.UpdateLocation` | Uploads current GPS position batch |
| Location history | `TrackingManager.GetLocationHistory` | Paginated historical positions |
| Register device | `Notifier.RegisterDevice` | Push notification token registration |
| Unregister device | `Notifier.UnregisterDevice` | Remove push token |

---

## 5. Voice SOS Activation

**Hook:** `hooks/useVoiceSosActivation.ts`

Uses `expo-speech-recognition` in continuous mode to listen for trigger phrases:
- `"help me"`, `"emergency"`, `"emergency now"`, `"send emergency"`, `"tracknest emergency"`

On detection:
1. 3-second debounce prevents duplicate triggers
2. Navigates to `/sos` screen
3. SOS screen shows 10-second countdown then calls `emergencyService.createEmergencyRequest()`

**Fixed rerender issue:** Event handler callbacks now use refs for `router` and `pathname` to avoid re-registering listeners on every navigation.

---

## 6. Data Flow Diagrams

### SOS Emergency Flow
```
User says "help me"
    ↓ (expo-speech-recognition)
useVoiceSosActivation detects phrase
    ↓ router.push("/sos")
SOS Screen (10s countdown)
    ↓ countdown reaches 0
emergencyService.createEmergencyRequest({
  targetId: selfUserId,
  lastLatitudeDegrees: lat,
  lastLongitudeDegrees: lng
})
    ↓ POST /emergency-request-receiver/request
Emergency Ops Service creates request → Kafka event → Push notification to responders
```

### Crime Report Submission Flow
```
User fills Create Report form
    ↓
[Optional] Upload images → MinIO → get public URLs
    ↓
criminalReportsService.createCrimeReport({
  title, content, severity(1-5), date,
  latitude, longitude, numberOfVictims,
  numberOfOffenders, arrested
})
    ↓ POST /report-manager/crime-reports  (+ X-User-Id header)
Criminal Reports Service saves to PostgreSQL/PostGIS
    ↓ [Optional] publish: POST /report-manager/crime-reports/{id}/publish
Report becomes visible publicly
```

### Map Screen — Live Tracking Flow
```
Map Screen mounts
    ↓ useStreamedFollowers()
gRPC stream: TrackingManager.StreamFamilyLocations(familyCircleId)
    ↓ Server-side stream (EventSource via Envoy)
Follower positions update every few seconds
    ↓ FollowerMarker components update in place
    (no full re-render of MapView)
```

---

## 7. Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_SERVICE_URL` | User Tracking + Notifier gRPC base | `https://api.tracknestapp.org` |
| `EXPO_PUBLIC_EMERGENCY_URL` | Emergency Ops REST base | `https://api.tracknest.org/emergency-ops` |
| `EXPO_PUBLIC_CRIMINAL_URL` | Criminal Reports REST base | `http://api.tracknestapp.org/criminal-reports` |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps key (Android) | `AIzaSy...` |
| `EXPO_PUBLIC_KEYCLOAK_URL` | Keycloak base URL | `https://api.tracknestapp.org/auth` |
| `EXPO_PUBLIC_KEYCLOAK_REALM` | Keycloak realm | `public-dev` |
| `EXPO_PUBLIC_KEYCLOAK_CLIENT_ID` | OAuth client ID | `mobile` |
