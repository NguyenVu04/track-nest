package com.project.tracknest

import android.content.Intent
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class CrashDetectionModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "CrashDetectionModule"

  @ReactMethod
  fun start(threshold: Double, cooldownMs: Double, drivingMode: Boolean = false) {
    val context = reactContext.applicationContext
    val intent = Intent(context, CrashDetectionService::class.java).apply {
      putExtra(CrashDetectionService.EXTRA_THRESHOLD, threshold)
      putExtra(CrashDetectionService.EXTRA_COOLDOWN_MS, cooldownMs.toLong())
      putExtra(CrashDetectionService.EXTRA_DRIVING_MODE, drivingMode)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      ContextCompat.startForegroundService(context, intent)
    } else {
      context.startService(intent)
    }
  }

  @ReactMethod
  fun stop() {
    val context = reactContext.applicationContext
    val intent = Intent(context, CrashDetectionService::class.java)
    context.stopService(intent)
  }
}
