package com.project.tracknest

import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NativeLocationModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    private const val PREFS_NAME = "tracknest_native_location"
    private const val BUFFER_KEY = "location_buffer"
  }

  override fun getName(): String = "NativeLocationModule"

  @ReactMethod
  fun start() {
    val context = reactContext.applicationContext
    val intent = Intent(context, NativeLocationService::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      ContextCompat.startForegroundService(context, intent)
    } else {
      context.startService(intent)
    }
  }

  @ReactMethod
  fun stop() {
    val context = reactContext.applicationContext
    val intent = Intent(context, NativeLocationService::class.java)
    context.stopService(intent)
  }

  @ReactMethod
  fun consumeBufferedLocations(promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val data = prefs.getString(BUFFER_KEY, "[]") ?: "[]"
      prefs.edit().putString(BUFFER_KEY, "[]").apply()
      promise.resolve(data)
    } catch (e: Exception) {
      promise.reject("NATIVE_LOCATION_CONSUME_FAILED", e)
    }
  }
}
