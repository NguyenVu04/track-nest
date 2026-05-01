package com.project.tracknest

import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class NativeLocationModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    private const val PREFS_NAME = "tracknest_native_location"
    private const val BUFFER_KEY = "location_buffer"
    const val EVENT_MODE_CHANGED = "trackingModeChanged"
    const val EVENT_ACTIVITY_CHANGED = "activityChanged"
    const val EVENT_LOCATION_UPDATED = "locationUpdated"

    private var instance: NativeLocationModule? = null

    fun emitModeChange(mode: String) {
      instance?.sendEvent(EVENT_MODE_CHANGED, mode)
    }

    fun emitActivityChange(activity: String) {
      instance?.sendEvent(EVENT_ACTIVITY_CHANGED, activity)
    }

    fun emitLocationUpdate(latitude: Double, longitude: Double, speed: Double) {
      val map = Arguments.createMap().apply {
        putDouble("latitude", latitude)
        putDouble("longitude", longitude)
        putDouble("speed", speed)
      }
      instance?.sendEvent(EVENT_LOCATION_UPDATED, map)
    }
  }

  init {
    instance = this
  }

  override fun getName(): String = "NativeLocationModule"

  // Required by React Native's NativeEventEmitter protocol
  @ReactMethod
  fun addListener(eventName: String) {}

  @ReactMethod
  fun removeListeners(count: Double) {}

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

  private fun sendEvent(eventName: String, data: Any) {
    try {
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(eventName, data)
    } catch (_: Exception) {}
  }
}
