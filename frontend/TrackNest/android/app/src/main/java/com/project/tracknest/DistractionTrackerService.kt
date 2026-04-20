package com.project.tracknest

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class DistractionTrackerService : NotificationListenerService() {

  companion object {
    const val PREFS_NAME = "tracknest_distraction_tracker"
    const val KEY_DRIVING_MODE = "driving_mode"
    const val KEY_CALL_COUNT = "call_count"
    const val KEY_SMS_COUNT = "sms_count"
    const val KEY_MESSAGING_COUNT = "messaging_count"
    const val KEY_SESSION_START = "session_start"
    const val KEY_RESET_TOKEN = "reset_token"

    val SMS_PACKAGES = setOf(
      "com.android.mms",
      "com.android.messaging",
      "com.google.android.apps.messaging",
      "com.samsung.android.messaging",
    )

    val MESSAGING_PACKAGES = setOf(
      "com.whatsapp",
      "com.whatsapp.w4b",
      "com.facebook.orca",
      "org.telegram.messenger",
      "com.zing.zalo",
      "com.viber.voip",
      "jp.naver.line.android",
      "com.facebook.mlite",
      "com.instagram.android",
      "com.snapchat.android",
    )
  }

  private val seenNotificationKeys = mutableSetOf<String>()
  private var lastResetToken: Int = -1

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    val sbn = sbn ?: return
    val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)

    if (!prefs.getBoolean(KEY_DRIVING_MODE, false)) return

    // Sync reset token so counts start fresh each driving session
    val resetToken = prefs.getInt(KEY_RESET_TOKEN, 0)
    if (resetToken != lastResetToken) {
      seenNotificationKeys.clear()
      lastResetToken = resetToken
    }

    // Skip our own app's notifications
    if (sbn.packageName == packageName) return

    // Deduplicate: don't count the same notification key twice
    val key = sbn.key
    if (!seenNotificationKeys.add(key)) return

    val notification = sbn.notification ?: return
    val category = notification.category
    val pkg = sbn.packageName

    val editor = prefs.edit()
    when {
      category == Notification.CATEGORY_CALL || pkg.contains("incallui") || pkg.contains("dialer") -> {
        editor.putInt(KEY_CALL_COUNT, prefs.getInt(KEY_CALL_COUNT, 0) + 1)
      }
      category == Notification.CATEGORY_MESSAGE && pkg in SMS_PACKAGES -> {
        editor.putInt(KEY_SMS_COUNT, prefs.getInt(KEY_SMS_COUNT, 0) + 1)
      }
      pkg in MESSAGING_PACKAGES -> {
        editor.putInt(KEY_MESSAGING_COUNT, prefs.getInt(KEY_MESSAGING_COUNT, 0) + 1)
      }
      category == Notification.CATEGORY_MESSAGE -> {
        editor.putInt(KEY_MESSAGING_COUNT, prefs.getInt(KEY_MESSAGING_COUNT, 0) + 1)
      }
    }
    editor.apply()
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification?) {}
}
