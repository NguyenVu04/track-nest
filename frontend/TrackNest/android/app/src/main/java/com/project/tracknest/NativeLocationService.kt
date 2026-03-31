package com.project.tracknest

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import org.json.JSONArray
import org.json.JSONObject

class NativeLocationService : Service() {

  companion object {
    private const val SERVICE_CHANNEL_ID = "native-location-service"
    private const val FOREGROUND_NOTIFICATION_ID = 43010
    private const val PREFS_NAME = "tracknest_native_location"
    private const val BUFFER_KEY = "location_buffer"
    private const val FAST_SPEED_UPGRADE_KMH = 30.0
    private const val FAST_SPEED_DOWNGRADE_KMH = 20.0

    private const val NORMAL_UPDATE_INTERVAL_MS = 30_000L
    private const val NORMAL_MIN_UPDATE_INTERVAL_MS = 15_000L
    private const val NORMAL_MIN_DISTANCE_M = 100f

    private const val NAV_UPDATE_INTERVAL_MS = 5_000L
    private const val NAV_MIN_UPDATE_INTERVAL_MS = 2_000L
    private const val NAV_MIN_DISTANCE_M = 5f
  }

  private enum class TrackingMode {
    NORMAL,
    NAVIGATION,
  }

  private data class RequestConfig(
    val priority: Int,
    val intervalMs: Long,
    val minIntervalMs: Long,
    val minDistanceMeters: Float,
  )

  private lateinit var fusedClient: FusedLocationProviderClient
  private lateinit var prefs: SharedPreferences
  private var trackingMode: TrackingMode = TrackingMode.NORMAL

  private val locationCallback = object : LocationCallback() {
    override fun onLocationResult(result: LocationResult) {
      val locations = result.locations
      if (locations.isNullOrEmpty()) return

      val buffer = JSONArray(prefs.getString(BUFFER_KEY, "[]") ?: "[]")

      for (location in locations) {
        maybeAdjustTrackingMode(location.speed.toDouble())

        val item = JSONObject().apply {
          put("latitude", location.latitude)
          put("longitude", location.longitude)
          put("accuracy", location.accuracy.toDouble())
          put("speed", location.speed.toDouble())
          put("timestamp", location.time)
        }
        buffer.put(item)
      }

      prefs.edit().putString(BUFFER_KEY, buffer.toString()).apply()
    }
  }

  override fun onCreate() {
    super.onCreate()
    fusedClient = LocationServices.getFusedLocationProviderClient(this)
    prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    ensureChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startForeground(FOREGROUND_NOTIFICATION_ID, buildForegroundNotification())
    startLocationUpdates(TrackingMode.NORMAL)
    return START_STICKY
  }

  override fun onDestroy() {
    stopLocationUpdates()
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun startLocationUpdates(mode: TrackingMode) {
    val config = when (mode) {
      TrackingMode.NORMAL -> RequestConfig(
        priority = Priority.PRIORITY_HIGH_ACCURACY,
        intervalMs = NORMAL_UPDATE_INTERVAL_MS,
        minIntervalMs = NORMAL_MIN_UPDATE_INTERVAL_MS,
        minDistanceMeters = NORMAL_MIN_DISTANCE_M,
      )
      TrackingMode.NAVIGATION -> RequestConfig(
        priority = Priority.PRIORITY_HIGH_ACCURACY,
        intervalMs = NAV_UPDATE_INTERVAL_MS,
        minIntervalMs = NAV_MIN_UPDATE_INTERVAL_MS,
        minDistanceMeters = NAV_MIN_DISTANCE_M,
      )
    }

    val request = LocationRequest.Builder(config.priority, config.intervalMs)
      .setMinUpdateDistanceMeters(config.minDistanceMeters)
      .setMinUpdateIntervalMillis(config.minIntervalMs)
      .build()

    try {
      trackingMode = mode
      fusedClient.requestLocationUpdates(request, locationCallback, mainLooper)
    } catch (_: SecurityException) {
      stopSelf()
    }
  }

  private fun maybeAdjustTrackingMode(speedMetersPerSecond: Double) {
    if (speedMetersPerSecond < 0) return

    val speedKmh = speedMetersPerSecond * 3.6

    when (trackingMode) {
      TrackingMode.NORMAL -> {
        if (speedKmh >= FAST_SPEED_UPGRADE_KMH) {
          switchTrackingMode(TrackingMode.NAVIGATION)
        }
      }
      TrackingMode.NAVIGATION -> {
        if (speedKmh <= FAST_SPEED_DOWNGRADE_KMH) {
          switchTrackingMode(TrackingMode.NORMAL)
        }
      }
    }
  }

  private fun switchTrackingMode(nextMode: TrackingMode) {
    if (nextMode == trackingMode) return
    stopLocationUpdates()
    startLocationUpdates(nextMode)
  }

  private fun stopLocationUpdates() {
    fusedClient.removeLocationUpdates(locationCallback)
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val channel = NotificationChannel(
      SERVICE_CHANNEL_ID,
      "Background location tracking",
      NotificationManager.IMPORTANCE_LOW,
    )
    channel.description = "Keeps location tracking active in background"
    manager.createNotificationChannel(channel)
  }

  private fun buildForegroundNotification(): Notification {
    return NotificationCompat.Builder(this, SERVICE_CHANNEL_ID)
      .setContentTitle("TrackNest location tracking active")
      .setContentText("Collecting location in background")
      .setSmallIcon(R.drawable.notification_icon)
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()
  }
}
