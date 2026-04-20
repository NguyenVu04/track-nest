package com.project.tracknest

import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DistractionTrackerModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "DistractionTrackerModule"

  @ReactMethod
  fun isPermissionGranted(promise: Promise) {
    try {
      val enabledListeners = Settings.Secure.getString(
        reactContext.contentResolver,
        "enabled_notification_listeners",
      ) ?: ""
      promise.resolve(enabledListeners.contains(reactContext.packageName))
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun openPermissionSettings() {
    val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    reactContext.startActivity(intent)
  }

  @ReactMethod
  fun setDrivingMode(enabled: Boolean) {
    val prefs = reactContext.getSharedPreferences(
      DistractionTrackerService.PREFS_NAME,
      Context.MODE_PRIVATE,
    )
    val editor = prefs.edit().putBoolean(DistractionTrackerService.KEY_DRIVING_MODE, enabled)
    if (enabled) {
      val newToken = (prefs.getInt(DistractionTrackerService.KEY_RESET_TOKEN, 0) + 1)
      editor
        .putInt(DistractionTrackerService.KEY_RESET_TOKEN, newToken)
        .putInt(DistractionTrackerService.KEY_CALL_COUNT, 0)
        .putInt(DistractionTrackerService.KEY_SMS_COUNT, 0)
        .putInt(DistractionTrackerService.KEY_MESSAGING_COUNT, 0)
        .putLong(DistractionTrackerService.KEY_SESSION_START, System.currentTimeMillis())
    }
    editor.apply()
  }

  @ReactMethod
  fun getDistractionCounts(promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences(
        DistractionTrackerService.PREFS_NAME,
        Context.MODE_PRIVATE,
      )
      val map = Arguments.createMap().apply {
        putInt("calls", prefs.getInt(DistractionTrackerService.KEY_CALL_COUNT, 0))
        putInt("sms", prefs.getInt(DistractionTrackerService.KEY_SMS_COUNT, 0))
        putInt("messaging", prefs.getInt(DistractionTrackerService.KEY_MESSAGING_COUNT, 0))
        putDouble(
          "sessionStartMs",
          prefs.getLong(DistractionTrackerService.KEY_SESSION_START, 0L).toDouble(),
        )
      }
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("DISTRACTION_COUNTS_FAILED", e)
    }
  }
}
