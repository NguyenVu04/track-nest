# FCM Push Notification Flow

This document describes the complete Firebase Cloud Messaging (FCM) flow for TrackNest — from device registration through push delivery and notification management.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Mobile App (Expo / React Native)                                           │
│                                                                             │
│  app/(app)/_layout.tsx                                                      │
│    └─> usePushNotifications(isAuthenticated)     hooks/usePushNotifications │
│         ├─> registerForPushNotificationsAsync()  utils/notifications.ts     │
│         ├─> registerMobileDevice(token, ...)     services/notifier.ts       │
│         ├─> addNotificationReceivedListener()                               │
│         ├─> addNotificationResponseReceivedListener()                       │
│         └─> addPushTokenListener()  (token refresh → re-register)           │
└──────────────────────────┬──────────────────────────────────────────────────┘
                           │ gRPC (grpc-web)
                           │ Dev:  SERVICE_URL:8800
                           │ Prod: SERVICE_URL/grpc
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  user-tracking service  (Spring Boot + gRPC :19090)                         │
│                                                                             │
│  NotifierController.java                                                    │
│    └─> NotifierServiceImpl.java                                             │
│         └─> mobile_device table (PostgreSQL)                                │
│              { id, device_token, platform, language_code, user_id }         │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │ Kafka                  │                        │
          │ topic: tracking-notification   topic: risk-notification
          ▼                        ▼                        │
┌─────────────────┐    ┌──────────────────────────────────┐ │
│  emergency-ops  │    │  user-tracking (consumer)        │ │
│  (producer)     │    │                                  │ │
│                 │    │  NotificationTrigger.java        │ │
│  Publishes on   │    │    └─> NotificationMessageConsumer │
│  emergency      │    │         ├─> findByTargetId()     │ │
│  request create │    │         ├─> rate-limit (5 min)   │ │
└─────────────────┘    │         └─> FcmService.java      │ │
                       └──────────────┬───────────────────┘ │
                                      │                     │
                                      ▼                     │
                       ┌──────────────────────────┐         │
                       │  Firebase Admin SDK      │         │
                       │  firebase-admin:9.7.1    │         │
                       │                          │         │
                       │  FirebaseMessaging       │         │
                       │    .getInstance()        │         │
                       │    .send(message)        │         │
                       └──────────────┬───────────┘         │
                                      │ HTTPS               │
                                      ▼                     │
                       ┌──────────────────────────┐         │
                       │  Google FCM Servers      │         │
                       └──────────────┬───────────┘         │
                                      │                     │
                                      ▼                     │
                       ┌──────────────────────────┐         │
                       │  Android Device          │◄────────┘
                       │  (push notification)     │
                       └──────────────────────────┘
```

---

## Phase 1 — Device Registration

### 1.1 App Startup

On app load, `app/index.tsx` runs immediately before any redirect:
- Requests foreground + background location permissions
- Registers the background upload task
- Sets up the location upload notification channel

### 1.2 Authentication Gate

Once the user authenticates, `app/(app)/_layout.tsx` mounts and calls:

```ts
// app/(app)/_layout.tsx
usePushNotifications(isAuthenticated)
```

### 1.3 Token Retrieval

`hooks/usePushNotifications.ts` calls `registerForPushNotificationsAsync()` from `utils/notifications.ts`:

```
1. Device.isDevice check — physical device only, emulators return undefined
2. setupNotificationChannels() — creates "default" Android channel (importance: MAX)
3. getPermissionsAsync() — check existing permission
4. requestPermissionsAsync() — prompt user if not yet granted
5. getDevicePushTokenAsync() — fetches native FCM token from Google
```

The returned token is a long string like `dABC123...` — this is the FCM registration token.

### 1.4 Backend Registration

The token is sent to the `user-tracking` service via gRPC-web in `services/notifier.ts`:

```
RegisterMobileDevice(deviceToken, platform, languageCode)
  └─> gRPC → NotifierController.java
       └─> NotifierServiceImpl.registerMobileDevice()
            └─> INSERT INTO mobile_device (device_token, platform, language_code, user_id)
```

The `user_id` is extracted from the JWT in the gRPC security context — the mobile app does not send it explicitly.

### 1.5 Token Refresh

FCM can rotate tokens at any time. The hook listens for this:

```ts
Notifications.addPushTokenListener(async (newToken) => {
  await registerMobileDevice(newToken.data, platform, "en");
});
```

This re-calls `RegisterMobileDevice` with the new token automatically.

---

## Phase 2 — Sending Push Notifications

There are two notification types, each triggered by a different Kafka message.

### 2.1 Tracking Notification

Sent to **all family members** of a target user (e.g., when an emergency is assigned).

**Kafka topic:** `tracking-notification`

**Payload:**
```json
{
  "targetId": "<uuid of the tracked user>",
  "title": "New Emergency Request Assigned",
  "content": "An emergency request for family member X has been assigned.",
  "type": "EMERGENCY_REQUEST_ASSIGNED"
}
```

**Producer:** `emergency-ops` service — fires when an emergency request is created.

**Consumer flow (`user-tracking`):**
```
NotificationTrigger.java (@KafkaListener)
  └─> NotificationMessageConsumerImpl.sendTrackingNotification()
       ├─> Validate target user exists
       ├─> findByTargetId(targetId)
       │    └─> SQL: finds devices of all family members who share a circle with targetId
       ├─> Redis rate-limit check: minimum 5 minutes between notifications per user
       ├─> FcmService.sendToTokens(deviceTokens, title, body)
       │    └─> FirebaseMessaging.getInstance().send(message) per token
       ├─> INSERT INTO tracking_notification (title, content, type, target_id)
       ├─> INSERT INTO tracker_tracking_notification (user_id, notification_id)
       └─> Produce "notification-sent" Kafka message
```

### 2.2 Risk Notification

Sent directly **to a specific user** (e.g., a safety alert for themselves).

**Kafka topic:** `risk-notification`

**Payload:**
```json
{
  "userId": "<uuid of recipient>",
  "title": "Safety Alert",
  "content": "A risk has been detected near your location.",
  "type": "RISK_ALERT"
}
```

**Consumer flow (`user-tracking`):**
```
NotificationTrigger.java (@KafkaListener)
  └─> NotificationMessageConsumerImpl.sendRiskNotification()
       ├─> Validate user exists
       ├─> findAllByUserId(userId) — get all registered devices for this user
       ├─> Redis rate-limit check: minimum 5 minutes
       ├─> FcmService.sendToTokens(deviceTokens, title, body)
       ├─> INSERT INTO risk_notification (title, content, type, user_id)
       └─> Produce "notification-sent" Kafka message
```

---

## Phase 3 — Receiving on the Mobile App

### 3.1 Foreground (app is open)

`hooks/usePushNotifications.ts` has a listener:

```ts
Notifications.addNotificationReceivedListener((notification) => {
  // notification.request.content.title
  // notification.request.content.body
  // notification.request.content.data
});
```

`utils/notifications.ts` configures how foreground notifications are displayed:

```ts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

### 3.2 Background / Killed (app not in foreground)

The OS delivers the notification to the system tray. When the user taps it:

```ts
Notifications.addNotificationResponseReceivedListener((response) => {
  const data = response.notification.request.content.data;
  if (data?.route) {
    router.push(data.route); // deep-link navigation
  }
});
```

### 3.3 Android Notification Channels

| Channel ID | Name | Importance | Used For |
|---|---|---|---|
| `default` | Default | MAX | FCM push notifications |
| `crash-detection` | Crash Detection | HIGH | Impact/crash alerts |
| `location-upload` | Location Upload | DEFAULT | Background upload status |
| `sos` | SOS | (set in sos.tsx) | SOS activation alerts |

---

## Phase 4 — Notification Management (gRPC)

After push delivery, notifications are persisted in the database. The mobile app manages them via `services/notifier.ts`:

| Method | gRPC RPC | Description |
|---|---|---|
| `listTrackingNotifications(pageSize, pageToken?)` | `ListTrackingNotifications` | Paginated list |
| `listRiskNotifications(pageSize, pageToken?)` | `ListRiskNotifications` | Paginated list |
| `deleteTrackingNotification(id)` | `DeleteTrackingNotification` | Delete one |
| `deleteTrackingNotifications(ids[])` | `DeleteTrackingNotifications` | Delete many |
| `clearTrackingNotifications()` | `ClearTrackingNotifications` | Delete all |
| `countTrackingNotifications()` | `CountTrackingNotifications` | Get total count |
| `deleteRiskNotification(id)` | `DeleteRiskNotification` | Delete one |
| `deleteRiskNotifications(ids[])` | `DeleteRiskNotifications` | Delete many |
| `clearRiskNotifications()` | `ClearRiskNotifications` | Delete all |
| `countRiskNotifications()` | `CountRiskNotifications` | Get total count |

The hook `hooks/useNotifications.ts` wraps these for use in UI components.

---

## Key Files Reference

### Mobile App

| File | Purpose |
|---|---|
| `hooks/usePushNotifications.ts` | Full FCM lifecycle: token, registration, listeners, refresh |
| `utils/notifications.ts` | Permission request, channel setup, token fetch, local scheduling |
| `services/notifier.ts` | gRPC-web client for all notifier RPCs |
| `hooks/useNotifications.ts` | In-app notification state management |
| `app/(app)/_layout.tsx` | Mounts `usePushNotifications` after auth |
| `app/index.tsx` | Early init: location permission, background task, upload channel |
| `app/(app)/(tabs)/notification-test.tsx` | Dev test screen for FCM |

### Backend (`user-tracking` service)

| File | Purpose |
|---|---|
| `controller/NotifierController.java` | gRPC endpoint handler |
| `domain/notifier/impl/NotifierServiceImpl.java` | Device CRUD business logic |
| `domain/notifier/impl/NotificationTrigger.java` | Kafka consumer entry point |
| `domain/notifier/impl/NotificationMessageConsumerImpl.java` | FCM send + DB save logic |
| `configuration/firebase/FcmService.java` | Firebase Admin SDK wrapper |
| `configuration/firebase/FirebaseConfig.java` | Firebase app initialization |
| `core/entity/MobileDevice.java` | Device token DB entity |
| `core/entity/TrackingNotification.java` | Tracking notification DB entity |
| `core/entity/RiskNotification.java` | Risk notification DB entity |
| `src/main/proto/notifier.proto` | gRPC service + message definitions |
| `src/main/resources/firebase-service-account.json` | Firebase credentials (not in VCS) |

---

## Configuration

### Mobile App — `.env`

```
EXPO_PUBLIC_SERVICE_URL=https://<your-backend-host>
```

In dev mode the gRPC client appends `:8800`. In production it uses `/grpc`.

### Mobile App — `app.json`

```json
"android": {
  "googleServicesFile": "./google-services.json",
  "permissions": [
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.FOREGROUND_SERVICE",
    "android.permission.FOREGROUND_SERVICE_LOCATION",
    "android.permission.ACCESS_BACKGROUND_LOCATION"
  ]
},
"plugins": [
  ["expo-notifications", {
    "defaultChannel": "default",
    "enableBackgroundRemoteNotifications": true
  }]
]
```

`POST_NOTIFICATIONS` is required for Android 13+ (API 33+). Without it, notifications are silently suppressed.

### Backend — Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GRPC_PORT` | `19090` | gRPC server port |
| `DB_HOST` | `127.0.0.1` | PostgreSQL host |
| `DB_PORT` | `15432` | PostgreSQL port |
| `DB_NAME` | `tracknest` | Database name |
| `DB_USERNAME` | `tracknestadmin` | DB username |
| `DB_PASSWORD` | `tracknestadmin` | DB password |
| `KAFKA_SERVER` | `127.0.0.1:29092` | Kafka bootstrap server |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis for rate-limiting |

Firebase credentials come from `firebase-service-account.json` on the classpath — not from env vars.

---

## Testing the Full Flow

### Step 1 — Verify Device Registration

1. Run the app on a **physical Android device** (emulators cannot receive FCM)
2. Open the **Push Test** tab (visible in dev mode)
3. Tap **Check Permission** → confirm `granted`
4. Tap **Get FCM Token** → a token string appears
5. Tap **Register with Backend** → confirm a success response is shown

Verify in the database:
```sql
SELECT device_token, platform, language_code, user_id, created_at
FROM mobile_device
ORDER BY created_at DESC
LIMIT 5;
```

### Step 2A — Send via Firebase Console (no Kafka needed)

1. Open [Firebase Console](https://console.firebase.google.com) → your project → Engage → Messaging
2. New campaign → Notification
3. Enter a title and body
4. Under Target → FCM registration token → paste the token from Step 1
5. Click **Test on device** → send

The notification appears immediately. If the app is open, the Notification Log section in the Push Test tab shows the entry.

### Step 2B — Send via Kafka (full backend flow)

Publish a message directly to the Kafka topic:

```bash
# Risk notification — delivered to the registered user
docker exec -it <kafka-container> \
  kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic risk-notification

# Paste (replace userId with the actual user UUID from the mobile_device table):
{"userId":"<user-uuid>","title":"Test Alert","content":"Full flow test from Kafka","type":"TEST"}
```

```bash
# Tracking notification — delivered to all family members of targetId
docker exec -it <kafka-container> \
  kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic tracking-notification

{"targetId":"<user-uuid>","title":"Location Update","content":"A family member shared their location","type":"LOCATION_UPDATE"}
```

Verify the notification was saved:
```sql
SELECT title, content, type, created_at FROM risk_notification ORDER BY created_at DESC LIMIT 5;
SELECT title, content, type, created_at FROM tracking_notification ORDER BY created_at DESC LIMIT 5;
```

### Step 2C — Send via Emergency-Ops (end-to-end)

Create an emergency request through the app's SOS feature or the `emergency-ops` REST/gRPC API. The service automatically publishes a `tracking-notification` Kafka message, which flows through `user-tracking` → Firebase → device.

### Step 3 — Local Notification Test (no backend needed)

In the Push Test tab:
1. Fill in **Title** and **Body**
2. Set delay to `5` seconds
3. Tap **Schedule Notification**
4. **Background the app** within 5 seconds
5. The OS notification appears in the tray

This tests the notification display pipeline independently of FCM delivery.

---

## Known Constraints

- **Rate limiting:** A maximum of one notification per user per 5 minutes is enforced via Redis. Back-to-back Kafka messages for the same user will be silently dropped after the first.
- **Physical device only:** `getDevicePushTokenAsync()` returns `undefined` on emulators. The Push Test tab and the `usePushNotifications` hook both guard against this with `Device.isDevice`.
- **Token immutability:** The `device_token` column is `updatable = false` in the database entity. A rotated token requires registering a new `MobileDevice` row, not updating the existing one.
- **iOS:** Not configured. `GoogleService-Info.plist` and `ios.googleServicesFile` in `app.json` are required before iOS push notifications can work.
