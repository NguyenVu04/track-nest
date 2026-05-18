# Family Notification Service — Bug Analysis

## Overview

Family push notifications (tracking anomaly alerts and risk alerts) are broken in both foreground and background on the mobile app. This document traces the complete front-to-back flow and identifies every root cause.

---

## End-to-End Flow (Expected)

```
Mobile location update
  → TrackerController.updateUserLocation (gRPC)
  → AnomalyDetectorHandlerImpl.detectAnomaly
  → publishes TrackingNotificationMessage to Kafka topic: tracking-notification
  → NotificationTrigger (@KafkaListener)
  → NotificationMessageConsumerImpl.sendTrackingNotification
      ├─ saves TrackingNotification to DB
      ├─ looks up family members via userRepository.findAllUserFamilyMembers()
      ├─ fetches device tokens from MobileDevice table
      └─ FcmService.sendToTokensWithData(tokens, title, body, data)
           → FCM delivers push to family members' devices

emergency-ops service
  → publishes RiskNotificationMessage to Kafka topic: risk-notification
  → NotificationTrigger (@KafkaListener)
  → NotificationMessageConsumerImpl.sendRiskNotification
      ├─ saves RiskNotification to DB
      ├─ fetches device tokens for the targeted user
      └─ FcmService.sendToTokens(tokens, title, body)
           → FCM delivers push to user's devices

Mobile device receives FCM push:
  → Foreground: configureNotificationHandler fires → shows banner + sound
  → Background: OS shows notification in tray, BACKGROUND_NOTIFICATION_TASK fires
  → User taps notification → addNotificationResponseReceivedListener fires
                           → app navigates to relevant screen
```

---

## Bug 1 — Firebase Admin SDK Cannot Initialize (Critical — Backend)

**File:** `service/user-tracking/src/main/java/project/tracknest/usertracking/configuration/firebase/FirebaseConfig.java:17-21`

```java
@PostConstruct
public void init() throws IOException {
    String path = System.getenv("FIREBASE_SERVICE_ACCOUNT_PATH");
    InputStream serviceAccount = (path != null && !path.isBlank())
            ? new FileInputStream(path)
            : new ClassPathResource("firebase-service-account.json").getInputStream();
    ...
}
```

The `FirebaseConfig` initializer requires either:
- The env var `FIREBASE_SERVICE_ACCOUNT_PATH` pointing to a service account JSON file, **or**
- A `firebase-service-account.json` classpath resource

Neither is present in the repository. Without the credential file, the `@PostConstruct` method throws an `IOException` at startup. Spring Boot will fail to start the application context, meaning **no FCM push notifications are ever sent** — neither tracking nor risk.

**Impact:** All FCM delivery is dead. `FcmService.sendToTokens()` and `sendToTokensWithData()` are never reached.

**Fix:** Supply `FIREBASE_SERVICE_ACCOUNT_PATH` in the environment (dev: `.env`, prod: Helm secret) pointing to the downloaded service account JSON from the Firebase console. Do not commit the file to the repo.

---

## Bug 2 — Risk Notifications Have No Data Payload (High — Backend)

**File:** `service/user-tracking/src/main/java/project/tracknest/usertracking/domain/notifier/impl/NotificationMessageConsumerImpl.java:120`

```java
int sent = fcmService.sendToTokens(deviceTokens, message.title(), message.content());
//                   ^^^^^^^^^^^^ notification-only, no data map
```

`sendToTokens` builds an FCM `MulticastMessage` with only a `Notification` object (title + body) and no `data` map. The mobile tap handler in `usePushNotifications.ts` needs a `data.type` or `data.route` field to know what to do when the user taps the notification.

Tracking notifications do include `Map.of("type", message.type())` (line 74), but risk notifications include nothing.

**Impact:** Tapping a risk notification brings the app to foreground but the tap handler finds `data` is empty and does nothing — the user is not routed anywhere.

**Fix:** Change the risk notification send to use `sendToTokensWithData` with at minimum `Map.of("type", "RISK")`.

---

## Bug 3 — No `route` Field in FCM Payload for Any Family Notification (High — Backend)

**File:** `service/user-tracking/src/main/java/project/tracknest/usertracking/domain/notifier/impl/NotificationMessageConsumerImpl.java:70-74`

```java
int sent = fcmService.sendToTokensWithData(
    deviceTokens,
    message.title(),
    message.content(),
    Map.of("type", message.type()));   // only "type", no "route"
```

The mobile tap handler falls through to a route-based redirect:

**File:** `frontend/TrackNest/hooks/usePushNotifications.ts:78-80`

```typescript
if (data?.route) {
  router.push(data.route as Parameters<Router["push"]>[0]);
}
```

`TRACKING` and `RISK` types are not in `EMERGENCY_TYPES` (line 60-65), so neither branch fires. Without a `route` key in the payload, the user taps the notification and nothing happens.

The chat notification workaround in `utils/notifications.ts:177` shows the correct pattern:

```typescript
data: { route: "/(app)/(tabs)/family-chat" },
```

**Fix:** Add `"route": "/(app)/notifications"` (or the appropriate screen path) to the data map for both tracking and risk FCM sends in `NotificationMessageConsumerImpl`.

---

## Bug 4 — Background Notification Task Ignores Tracking/Risk Notifications (High — Mobile)

**File:** `frontend/TrackNest/services/backgroundTasks.ts:127-166`

```typescript
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK_NAME, async ({ data, error }) => {
    const notifData = data?.notification?.request?.content?.data;

    if (notifData?.type === "chat_message") { /* handle */ return; }

    const EMERGENCY_TYPES = [...];
    if (notifData?.type && EMERGENCY_TYPES.includes(notifData.type as string)) {
        /* handle */ return;
    }

    // ← TRACKING and RISK fall through here with no action
});
```

The comment on line 124 explains the task's purpose — it fires for **data-only** FCM messages (no `notification` field). However, `sendToTokens` and `sendToTokensWithData` both set a `Notification` object (title + body), so on Android the OS displays the notification automatically and the background task **does not fire** for those messages.

This means the background task is not the problem for display — but it means **no badge counting or state syncing** occurs for tracking/risk notifications when the app is backgrounded. When the app relaunches and the tap handler runs, there is no persisted state to read (unlike emergency notifications which store `LAST_EMERGENCY_NOTIFICATION_TYPE` in AsyncStorage).

**Fix:** If the backend switches to data-only FCM for tracking/risk (to gain full background control), add handlers here. If keeping notification + data, ensure the tap handler (Bug 3) routes correctly.

---

## Bug 5 — Foreground Listener Is a No-Op for Tracking/Risk Notifications (Medium — Mobile)

**File:** `frontend/TrackNest/hooks/usePushNotifications.ts:55-58`

```typescript
notificationListener.current =
  Notifications.addNotificationReceivedListener((_notification) => {
    /* console.log("Notification received in foreground:", _notification) */;
  });
```

The foreground listener does nothing (the only active logic is commented out). For chat, this is intentional because the gRPC stream handles it. For tracking/risk notifications, there is no parallel stream — the only channel is FCM — so the foreground handler should at minimum update any notification badge count or trigger a list refresh.

`configureNotificationHandler` (`utils/notifications.ts:10-27`) correctly shows banners in foreground for non-chat notifications, so the user will see the alert. But no app state (unread count, notification list) updates until the user manually navigates to the notifications screen.

**Fix:** In the `addNotificationReceivedListener` callback, check `data.type` and emit a `DeviceEventEmitter` event (similar to `CHAT_BADGE_CHANGED_EVENT`) so the notifications tab can refresh its list.

---

## Bug 6 — `setupNotificationChannels()` Creates Only One Channel (Low — Mobile)

**File:** `frontend/TrackNest/utils/notifications.ts:34-43`

```typescript
export async function setupNotificationChannels() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", { ... });
  }
}
```

This function creates the `default` channel and is called from `registerForPushNotificationsAsync`. However, the `crash-detection`, `location-upload`, and `family-chat` channels are set up in separate functions (`setupCrashNotificationChannel`, `setupUploadNotificationChannel`, `setupChatNotificationChannel`) that must each be called explicitly.

Tracking and risk notifications are sent without a `channelId` in the FCM payload, so they fall to `default`. This works, but it means tracking/risk notifications share sound and vibration settings with unrelated "default" notifications. There is no dedicated channel for family alerts.

**Fix:** Create a `family-notifications` channel with appropriate settings and include `android_channel_id: "family-notifications"` in the FCM data payload from the backend.

---

## Summary Table

| # | Severity | Layer | File | Description |
|---|----------|-------|------|-------------|
| 1 | **Critical** | Backend | `FirebaseConfig.java:17` | Firebase Admin SDK fails to init — no FCM sends at all |
| 2 | **High** | Backend | `NotificationMessageConsumerImpl.java:120` | Risk notifications sent without any data payload |
| 3 | **High** | Backend | `NotificationMessageConsumerImpl.java:70-74` | No `route` field in FCM data — tap does nothing |
| 4 | **High** | Mobile | `backgroundTasks.ts:127-166` | Background task has no handler for `TRACKING`/`RISK` types |
| 5 | **Medium** | Mobile | `usePushNotifications.ts:55-58` | Foreground listener is a no-op — no state/badge update |
| 6 | **Low** | Mobile | `notifications.ts:34-43` | No dedicated Android notification channel for family alerts |

---

## Required Fixes (Ordered by Priority)

1. **Provide Firebase service account credentials** — set `FIREBASE_SERVICE_ACCOUNT_PATH` in the service environment. Without this nothing works.

2. **Add `route` and `type` to all FCM data payloads** in `NotificationMessageConsumerImpl`:
   - Tracking: `Map.of("type", "TRACKING", "route", "/(app)/notifications")`
   - Risk: `Map.of("type", "RISK", "route", "/(app)/notifications")` using `sendToTokensWithData`

3. **Handle `TRACKING`/`RISK` types in `usePushNotifications.ts`** tap listeners (both `addNotificationResponseReceivedListener` and `getLastNotificationResponseAsync`) — route to the notifications screen.

4. **Emit a refresh event from the foreground listener** in `usePushNotifications.ts` when `data.type` is `TRACKING` or `RISK`, so the notifications list updates without requiring a manual navigation.

5. **Persist last tracking/risk notification metadata to AsyncStorage** in the background task (mirroring the emergency pattern at `backgroundTasks.ts:157-160`) so the app can refresh the list on next open.

6. **(Optional)** Add a dedicated `family-notifications` Android notification channel and pass `android_channel_id` in the FCM payload for better UX control.
