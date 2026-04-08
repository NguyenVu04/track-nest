# User Tracking Service — API Reference

> **Transport:** This service exposes a **gRPC** API on port `19090`. The web frontend communicates via a REST-to-gRPC gateway on port `18080`.  
> **Authentication:** All methods require a valid Keycloak JWT. The user ID is extracted server-side from the token.

---

## Tracker — `TrackerController`

Handles real-time location streaming and location history queries.

### `streamFamilyMemberLocations` (Server-Side Streaming)

Streams the current and future locations of all members in a family circle. The server first sends the last known location of each member, then continues pushing updates as members' locations change.

**Request:** `StreamFamilyMemberLocationsRequest`

| Field | Type | Description |
|-------|------|-------------|
| `familyCircleId` | string (UUID) | ID of the family circle to stream |

**Response Stream:** `FamilyMemberLocation`

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Member's user ID |
| `latitude` | double | Current latitude |
| `longitude` | double | Current longitude |
| `timestamp` | Timestamp | Time of the location update |

---

### `listFamilyMemberLocationHistory` (Unary)

Returns historical location data for a family circle member within a time range.

**Request:** `ListFamilyMemberLocationHistoryRequest`

| Field | Type | Description |
|-------|------|-------------|
| `targetUserId` | string (UUID) | The member whose history to retrieve |
| `familyCircleId` | string (UUID) | Circle context for authorization |
| `startTime` | Timestamp | Start of the history window |
| `endTime` | Timestamp | End of the history window |

**Response:** `ListFamilyMemberLocationHistoryResponse`

| Field | Type | Description |
|-------|------|-------------|
| `locations` | repeated `FamilyMemberLocation` | Ordered list of locations |

---

### `updateUserLocation` (Unary)

Updates the authenticated user's current location. Triggers push notifications to family circle members and risk zone checks.

**Request:** `UpdateUserLocationRequest`

| Field | Type | Description |
|-------|------|-------------|
| `latitude` | double | New latitude |
| `longitude` | double | New longitude |

**Response:** `UpdateUserLocationResponse`

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | Whether the update was applied |

---

## Tracking Manager — `TrackingManagerController`

Manages family circles, membership, and participation permissions.

### `createFamilyCircle` (Unary)

Creates a new family circle. The caller becomes the `OWNER`.

**Request:** `CreateFamilyCircleRequest`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Display name of the circle |

**Response:** `CreateFamilyCircleResponse`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | New circle UUID |
| `name` | string | Circle name |
| `ownerId` | string | Creator's user ID |
| `createdAt` | Timestamp | Creation timestamp |

---

### `listFamilyCircles` (Unary)

Lists all family circles the authenticated user belongs to (any role).

**Request:** `ListFamilyCirclesRequest`

| Field | Type | Description |
|-------|------|-------------|
| `page` | int32 | Page index (0-based) |
| `size` | int32 | Page size |

**Response:** `ListFamilyCircleResponse`

| Field | Type | Description |
|-------|------|-------------|
| `circles` | repeated `FamilyCircle` | List of circles |
| `totalElements` | int64 | Total count |

---

### `deleteFamilyCircle` (Unary)

Deletes a family circle. Requires `OWNER` role.

**Request:** `DeleteFamilyCircleRequest`

| Field | Type | Description |
|-------|------|-------------|
| `familyCircleId` | string | Circle to delete |

**Response:** `DeleteFamilyCircleResponse`

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | Whether deletion succeeded |

---

### `updateFamilyCircle` (Unary)

Updates a family circle's name. Requires `OWNER` or `ADMIN` role.

**Request:** `UpdateFamilyCircleRequest`

| Field | Type | Description |
|-------|------|-------------|
| `familyCircleId` | string | Circle to update |
| `name` | string | New name |

**Response:** `UpdateFamilyCircleResponse` — updated `FamilyCircle`

---

### `updateFamilyRole` (Unary)

Changes a member's role within a circle. Requires `OWNER` role.

**Request:** `UpdateFamilyRoleRequest`

| Field | Type | Description |
|-------|------|-------------|
| `familyCircleId` | string | Target circle |
| `targetUserId` | string | Member to update |
| `role` | enum | `MEMBER` or `ADMIN` |

**Response:** `UpdateFamilyRoleResponse`

---

### `assignFamilyCircleAdmin` (Unary)

Promotes a member to `ADMIN`. Requires `OWNER` role.

**Request:** `AssignFamilyCircleAdminRequest`

| Field | Type | Description |
|-------|------|-------------|
| `familyCircleId` | string | Target circle |
| `targetUserId` | string | Member to promote |

**Response:** `AssignFamilyCircleAdminResponse`

---

### `createParticipationPermission` (Unary)

Generates a one-time invite code for joining a circle. Requires `OWNER` or `ADMIN` role.

**Request:** `CreateParticipationPermissionRequest`

| Field | Type | Description |
|-------|------|-------------|
| `familyCircleId` | string | Circle to invite to |
| `expiresAt` | Timestamp (optional) | Expiry time for the code |

**Response:** `CreateParticipationPermissionResponse`

| Field | Type | Description |
|-------|------|-------------|
| `permissionId` | string | Permission UUID |
| `code` | string | Invite code to share |

---

### `participateInFamilyCircle` (Unary)

Joins a family circle using an invite code.

**Request:** `ParticipateInFamilyCircleRequest`

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Invite code from `createParticipationPermission` |

**Response:** `ParticipateInFamilyCircleResponse` — joined `FamilyCircle`

---

### `leaveFamilyCircle` (Unary)

Removes the authenticated user from a circle. `OWNER` cannot leave (must delete or transfer).

**Request:** `LeaveFamilyCircleRequest`

| Field | Type | Description |
|-------|------|-------------|
| `familyCircleId` | string | Circle to leave |

**Response:** `LeaveFamilyCircleResponse`

---

### `removeMemberFromFamilyCircle` (Unary)

Removes a specific member from a circle. Requires `OWNER` or `ADMIN` role.

**Request:** `RemoveMemberFromFamilyCircleRequest`

| Field | Type | Description |
|-------|------|-------------|
| `familyCircleId` | string | Target circle |
| `targetUserId` | string | Member to remove |

**Response:** `RemoveMemberFromFamilyCircleResponse`

---

### `listFamilyCircleMembers` (Unary)

Lists all members of a family circle. Caller must be a member.

**Request:** `ListFamilyCircleMembersRequest`

| Field | Type | Description |
|-------|------|-------------|
| `familyCircleId` | string | Target circle |
| `page` | int32 | Page index |
| `size` | int32 | Page size |

**Response:** `ListFamilyCircleMembersResponse`

| Field | Type | Description |
|-------|------|-------------|
| `members` | repeated `FamilyCircleMember` | List of members |
| `totalElements` | int64 | Total count |

---

## Notifier — `NotifierController`

Manages push notification devices and notification history.

### `registerMobileDevice` (Unary)

Registers a mobile device for push notifications.

**Request:** `RegisterMobileDeviceRequest`

| Field | Type | Description |
|-------|------|-------------|
| `deviceToken` | string | FCM/APNs push token |
| `platform` | enum | `ANDROID` or `IOS` |

**Response:** `RegisterMobileDeviceResponse` — registered `MobileDevice`

---

### `unregisterMobileDevice` (Unary)

Removes a registered push notification device.

**Request:** `UnregisterMobileDeviceRequest`

| Field | Type | Description |
|-------|------|-------------|
| `deviceId` | string | Device UUID to remove |

**Response:** `UnregisterMobileDeviceResponse`

---

### `updateMobileDevice` (Unary)

Updates a device's enabled/disabled state.

**Request:** `UpdateMobileDeviceRequest`

| Field | Type | Description |
|-------|------|-------------|
| `deviceId` | string | Device UUID |
| `enabled` | bool | Whether to enable push notifications |

**Response:** `UpdateMobileDeviceResponse` — updated `MobileDevice`

---

### `listTrackingNotifications` (Unary)

Lists location/geofence/emergency tracking notifications for the user.

**Request:** `ListTrackingNotificationsRequest`

| Field | Type | Description |
|-------|------|-------------|
| `page` | int32 | Page index |
| `size` | int32 | Page size |

**Response:** `ListTrackingNotificationsResponse`

| Field | Type | Description |
|-------|------|-------------|
| `notifications` | repeated `TrackingNotification` | Notification list |
| `totalElements` | int64 | Total count |

---

### `listRiskNotifications` (Unary)

Lists risk/anomaly zone notifications for the user.

**Request:** `ListRiskNotificationsRequest`

| Field | Type | Description |
|-------|------|-------------|
| `page` | int32 | Page index |
| `size` | int32 | Page size |

**Response:** `ListRiskNotificationsResponse`

---

### `deleteTrackingNotification` (Unary)

Deletes a single tracking notification.

**Request:** `DeleteTrackingNotificationRequest`

| Field | Type | Description |
|-------|------|-------------|
| `notificationId` | string | Notification UUID |

**Response:** `DeleteTrackingNotificationResponse`

---

### `deleteRiskNotification` (Unary)

Deletes a single risk notification.

**Request:** `DeleteRiskNotificationRequest`

| Field | Type | Description |
|-------|------|-------------|
| `notificationId` | string | Notification UUID |

**Response:** `DeleteRiskNotificationResponse`

---

### `deleteTrackingNotifications` (Unary)

Deletes multiple tracking notifications by ID list.

**Request:** `DeleteTrackingNotificationsRequest`

| Field | Type | Description |
|-------|------|-------------|
| `notificationIds` | repeated string | List of UUIDs to delete |

**Response:** `DeleteTrackingNotificationsResponse`

---

### `deleteRiskNotifications` (Unary)

Deletes multiple risk notifications by ID list.

**Request:** `DeleteRiskNotificationsRequest`

| Field | Type | Description |
|-------|------|-------------|
| `notificationIds` | repeated string | List of UUIDs to delete |

**Response:** `DeleteRiskNotificationsResponse`

---

### `clearTrackingNotifications` (Unary)

Clears all tracking notifications for the authenticated user.

**Request:** `ClearTrackingNotificationsRequest` (empty)  
**Response:** `ClearTrackingNotificationsResponse`

---

### `clearRiskNotifications` (Unary)

Clears all risk notifications for the authenticated user.

**Request:** `ClearRiskNotificationsRequest` (empty)  
**Response:** `ClearRiskNotificationsResponse`

---

### `countTrackingNotifications` (Unary)

Returns the count of unread tracking notifications.

**Request:** `CountTrackingNotificationsRequest` (empty)  
**Response:** `CountTrackingNotificationsResponse`

| Field | Type | Description |
|-------|------|-------------|
| `count` | int64 | Total tracking notification count |

---

### `countRiskNotifications` (Unary)

Returns the count of unread risk notifications.

**Request:** `CountRiskNotificationsRequest` (empty)  
**Response:** `CountRiskNotificationsResponse`

| Field | Type | Description |
|-------|------|-------------|
| `count` | int64 | Total risk notification count |
