# Emergency Ops Service — API Reference

Base URL: `http://localhost:28080`

> **Authentication:** All endpoints require a valid Keycloak JWT Bearer token. The user identity (service/user ID) is extracted from the token — no `X-User-Id` header is needed.

---

## Emergency Request Receiver — `/emergency-request-receiver`

Used by regular **Users** to submit and view their own emergency requests.

### `POST /emergency-request-receiver/request`

Creates a new emergency request. The sender ID is derived from the JWT.

**Body (JSON)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetId` | UUID | yes | ID of the emergency service to contact |
| `lastLatitudeDegrees` | double | yes | Sender's current latitude |
| `lastLongitudeDegrees` | double | yes | Sender's current longitude |

**Response:** `PostEmergencyRequestResponse`

---

### `GET /emergency-request-receiver/requests`

Returns a paginated list of emergency requests submitted by the authenticated user.

**Query Parameters (Spring Pageable)**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `page` | int | `0` | Page index |
| `size` | int | `20` | Page size |
| `sort` | string | — | Sort field and direction (e.g. `openAt,desc`) |

**Response:** `PageResponse<GetTrackerEmergencyRequestsResponse>`

---

## Emergency Request Manager — `/emergency-request-manager`

Used by **Emergency Services** to manage incoming requests and their own location.

### `PATCH /emergency-request-manager/emergency-service/location`

Updates the authenticated emergency service's current location.

**Body (JSON)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `latitude` | double | yes | Current latitude |
| `longitude` | double | yes | Current longitude |

**Response:** `PatchEmergencyServiceLocationResponse`

---

### `GET /emergency-request-manager/emergency-service/location`

Retrieves the authenticated emergency service's last known location.

**Response:** `GetEmergencyServiceLocationResponse`

```json
{
  "emergencyServiceId": "uuid",
  "latitude": 10.8231,
  "longitude": 106.6297,
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

---

### `GET /emergency-request-manager/requests/count`

Returns the count of emergency requests assigned to the authenticated service, optionally filtered by status.

**Query Parameters**

| Name | Type | Required | Values |
|------|------|----------|--------|
| `status` | enum | no | `PENDING`, `ACCEPTED`, `REJECTED`, `COMPLETED` |

**Response:** `GetRequestCountResponse`

```json
{ "count": 12 }
```

---

### `GET /emergency-request-manager/requests`

Returns a paginated list of emergency requests assigned to the authenticated service.

**Query Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `status` | enum | no | — | Filter by `PENDING`, `ACCEPTED`, `REJECTED`, `COMPLETED` |
| `page` | int | no | `0` | Page index |
| `size` | int | no | `20` | Page size |
| `sort` | string | no | — | Sort field and direction |

**Response:** `PageResponse<GetEmergencyRequestsResponse>`

---

### `PATCH /emergency-request-manager/requests/{requestId}/accept`

Accepts a pending emergency request. Sets status to `ACCEPTED`.

**Path Parameters:** `requestId` (UUID)  
**Response:** `AcceptEmergencyRequestResponse`

---

### `PATCH /emergency-request-manager/requests/{requestId}/reject`

Rejects a pending emergency request. Sets status to `REJECTED`.

**Path Parameters:** `requestId` (UUID)  
**Response:** `RejectEmergencyRequestResponse`

---

### `PATCH /emergency-request-manager/requests/{requestId}/close`

Closes an accepted emergency request. Sets status to `COMPLETED`.

**Path Parameters:** `requestId` (UUID)  
**Response:** `CloseEmergencyRequestResponse`

---

## Emergency Responder — `/emergency-responder`

Used by **Emergency Services** to view users who have active accepted requests targeting them.

### `GET /emergency-responder/targets`

Returns a paginated list of users (targets) whose emergency requests are currently accepted by this service.

**Query Parameters (Spring Pageable)**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `page` | int | `0` | Page index |
| `size` | int | `20` | Page size |

**Response:** `PageResponse<GetEmergencyServiceTargetsResponse>`

```json
{
  "content": [
    {
      "userId": "uuid",
      "lastLatitude": 10.8231,
      "lastLongitude": 106.6297,
      "lastUpdateTime": "2026-01-01T00:00:00Z"
    }
  ],
  "page": 0, "size": 20, "totalElements": 1, "totalPages": 1
}
```

---

## Safe Zone Manager — `/safe-zone-manager`

Used by **Emergency Services** to create and manage safe zones they own.

### `POST /safe-zone-manager/safe-zone`

Creates a new safe zone owned by the authenticated emergency service.

**Body (JSON)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string (≤255 chars) | yes | Display name of the safe zone |
| `latitude` | double | yes | Center latitude |
| `longitude` | double | yes | Center longitude |
| `radius` | float (> 0) | yes | Radius in meters |

**Response:** `PostSafeZoneResponse`

```json
{
  "id": "uuid",
  "name": "Central Police Station",
  "latitude": 10.8231,
  "longitude": 106.6297,
  "radius": 500.0,
  "createdAt": "2026-01-01T00:00:00Z",
  "emergencyServiceId": "uuid"
}
```

---

### `GET /safe-zone-manager/safe-zones`

Returns a paginated list of safe zones owned by the authenticated service.

**Query Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `nameFilter` | string (≤100 chars) | no | — | Partial name search |
| `page` | int | no | `0` | Page index |
| `size` | int | no | `20` | Page size |

**Response:** `PageResponse<GetServiceSafeZonesResponse>`

---

### `PUT /safe-zone-manager/safe-zone/{safeZoneId}`

Updates a safe zone owned by the authenticated service.

**Path Parameters:** `safeZoneId` (UUID)  
**Body (JSON):** Same fields as `POST /safe-zone-manager/safe-zone`  
**Response:** `PutSafeZoneResponse`

---

### `DELETE /safe-zone-manager/safe-zone/{safeZoneId}`

Deletes a safe zone owned by the authenticated service.

**Path Parameters:** `safeZoneId` (UUID)  
**Response:** `DeleteSafeZoneResponse`

```json
{ "id": "uuid", "deleted": true }
```

---

## Safe Zone Locator — `/safe-zone-locator`

Public-accessible endpoint for finding nearby safe zones. No ownership restriction.

### `GET /safe-zone-locator/safe-zones/nearest`

Returns the nearest safe zones to a given coordinate, within a maximum distance.

**Query Parameters**

| Name | Type | Required | Validation | Description |
|------|------|----------|-----------|-------------|
| `latitudeDegrees` | double | yes | -90 to 90 | Query latitude |
| `longitudeDegrees` | double | yes | -180 to 180 | Query longitude |
| `maxDistanceMeters` | float | yes | ≥ 0 | Maximum search radius in meters |
| `maxNumberOfSafeZones` | int | yes | 1–64 | Maximum number of results to return |

**Response:** `List<GetNearestSafeZonesResponse>`

```json
[
  {
    "id": "uuid",
    "name": "Central Police Station",
    "latitude": 10.8231,
    "longitude": 106.6297,
    "radius": 500.0,
    "distanceMeters": 123.4,
    "emergencyServiceId": "uuid"
  }
]
```

---

## Data Shapes

Canonical JSON schemas for all request bodies and response objects.

### `PageResponse<T>`

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5,
  "first": true,
  "last": false
}
```

---

### Emergency Request — Shared Response Shape

All emergency request endpoints (`POST /request`, `PATCH /accept`, `PATCH /reject`, `PATCH /close`) return the same shape:

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID string | |
| `openAt` | string (ISO 8601) | When the request was opened |
| `closeAt` | string (ISO 8601) \| null | When closed/completed, null if still open |
| `senderId` | UUID string | User who sent the request |
| `targetId` | UUID string | Target user ID |
| `emergencyServiceId` | UUID string | Service handling the request |
| `statusName` | `"PENDING"` \| `"ACCEPTED"` \| `"REJECTED"` \| `"COMPLETED"` | |
| `longitude` | double | Sender's longitude at time of request |
| `latitude` | double | Sender's latitude at time of request |

```json
{
  "id": "c1c11111-1111-1111-1111-111111111111",
  "openAt": "2026-03-04T09:30:00+07:00",
  "closeAt": null,
  "senderId": "uuid",
  "targetId": "uuid",
  "emergencyServiceId": "uuid",
  "statusName": "PENDING",
  "longitude": 106.7004,
  "latitude": 10.7766
}
```

---

### `CreateEmergencyRequestRequest`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetId` | UUID | yes | ID of the emergency service to contact |
| `lastLatitudeDegrees` | double | yes | Sender's current latitude |
| `lastLongitudeDegrees` | double | yes | Sender's current longitude |

---

### `UpdateEmergencyServiceLocationRequest`

| Field | Type | Required |
|-------|------|----------|
| `latitude` | double | yes |
| `longitude` | double | yes |

---

### `GetEmergencyServiceLocationResponse`

| Field | Type |
|-------|------|
| `emergencyServiceId` | UUID string |
| `latitude` | double |
| `longitude` | double |
| `updatedAt` | string (ISO 8601) |

---

### `GetRequestCountResponse`

```json
{ "count": 12 }
```

---

### `GetEmergencyServiceTargetsResponse` (per item in page)

| Field | Type |
|-------|------|
| `userId` | UUID string |
| `lastLatitude` | double |
| `lastLongitude` | double |
| `lastUpdateTime` | string (ISO 8601) |

---

### Safe Zone Response Shape

Used by `POST /safe-zone-manager/safe-zone`, `PUT /safe-zone-manager/safe-zone/{id}`, and items in `GET /safe-zone-manager/safe-zones`.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID string | |
| `name` | string | |
| `latitude` | double | |
| `longitude` | double | |
| `radius` | float | In meters |
| `createdAt` | string (ISO 8601) | |
| `emergencyServiceId` | UUID string | |

---

### `DeleteSafeZoneResponse`

```json
{ "id": "uuid", "deleted": true }
```

---

### `CreateSafeZoneRequest` / `UpdateSafeZoneRequest`

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `name` | string | yes | ≤ 255 chars |
| `latitude` | double | yes | |
| `longitude` | double | yes | |
| `radius` | float | yes | > 0 |

---

### Emergency Request Status Values

| Value | Meaning |
|-------|---------|
| `PENDING` | Submitted, awaiting response |
| `ACCEPTED` | Emergency service accepted |
| `REJECTED` | Emergency service rejected |
| `COMPLETED` | Request resolved and closed |
