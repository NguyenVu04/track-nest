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
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.location.ActivityRecognition
import com.google.android.gms.location.ActivityRecognitionClient
import com.google.android.gms.location.DetectedActivity
import org.json.JSONArray
import org.json.JSONObject

class NativeLocationService : Service() {

  companion object {
    private const val SERVICE_CHANNEL_ID = "native-location-service"
    private const val FOREGROUND_NOTIFICATION_ID = 43010
    private const val PREFS_NAME = "tracknest_native_location"
    private const val BUFFER_KEY = "location_buffer"
    private const val FAST_SPEED_UPGRADE_KMH = 10.0
    private const val FAST_SPEED_DOWNGRADE_KMH = 10.0

    private const val NORMAL_UPDATE_INTERVAL_MS = 60_000L
    private const val NORMAL_MIN_UPDATE_INTERVAL_MS = 30_000L
    private const val NORMAL_MIN_DISTANCE_M = 0f

    private const val NAV_UPDATE_INTERVAL_MS = 5_000L
    private const val NAV_MIN_UPDATE_INTERVAL_MS = 2_000L
    private const val NAV_MIN_DISTANCE_M = 0f

    private const val DRIVING_CRASH_THRESHOLD = 2.5
    private const val CRASH_COOLDOWN_MS = 15_000L

    private const val ACCURACY_THRESHOLD = 30f
    private const val MAX_DISPLACEMENT_METERS = 50f
    private const val ACTIVITY_UPDATE_INTERVAL_MS = 5_000L
  }

  private enum class TrackingMode {
    NORMAL,
    NAVIGATION,
  }

  private enum class UserActivity {
    STILL,
    WALKING,
    RUNNING,
    DRIVING,
    UNKNOWN,
  }

  private data class RequestConfig(
    val priority: Int,
    val intervalMs: Long,
    val minIntervalMs: Long,
    val minDistanceMeters: Float,
  )

  private lateinit var fusedClient: FusedLocationProviderClient
  private lateinit var activityClient: ActivityRecognitionClient
  private lateinit var prefs: SharedPreferences
  private var trackingMode: TrackingMode = TrackingMode.NORMAL
  private var currentActivity: UserActivity = UserActivity.UNKNOWN

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

        // In navigation mode emit directly to JS so the marker updates
        // immediately instead of waiting for the JS-side buffer poll.
        if (trackingMode == TrackingMode.NAVIGATION) {
          NativeLocationModule.emitLocationUpdate(
            location.latitude,
            location.longitude,
            location.speed.toDouble(),
          )
        }
      }

      prefs.edit().putString(BUFFER_KEY, buffer.toString()).apply()
    }
  }

  private val activityReceiver = object : android.content.BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (com.google.android.gms.location.ActivityRecognitionResult.hasResult(intent)) {
        val result = com.google.android.gms.location.ActivityRecognitionResult.extractResult(intent)
        result?.mostProbableActivity?.let { activity ->
          val newActivity = when (activity.type) {
            DetectedActivity.STILL -> UserActivity.STILL
            DetectedActivity.WALKING -> UserActivity.WALKING
            DetectedActivity.RUNNING -> UserActivity.RUNNING
            DetectedActivity.IN_VEHICLE, DetectedActivity.ON_BICYCLE -> UserActivity.DRIVING
            else -> UserActivity.UNKNOWN
          }
          if (newActivity != currentActivity) {
            currentActivity = newActivity
            NativeLocationModule.emitActivityChange(newActivity.name)
          }
        }
      }
    }
  }

  override fun onCreate() {
    super.onCreate()
    fusedClient = LocationServices.getFusedLocationProviderClient(this)
    activityClient = ActivityRecognition.getClient(this)
    prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    ensureChannel()

    val filter = android.content.IntentFilter("com.project.tracknest.ACTIVITY_UPDATE")
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(activityReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      registerReceiver(activityReceiver, filter)
    }

    startActivityRecognition()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startForeground(FOREGROUND_NOTIFICATION_ID, buildForegroundNotification())
    startLocationUpdates(TrackingMode.NORMAL)
    return START_STICKY
  }

  override fun onDestroy() {
    stopLocationUpdates()
    stopActivityRecognition()
    unregisterReceiver(activityReceiver)
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
        if (speedKmh < FAST_SPEED_DOWNGRADE_KMH) {
          switchTrackingMode(TrackingMode.NORMAL)
        }
      }
    }
  }

  private fun switchTrackingMode(nextMode: TrackingMode) {
    if (nextMode == trackingMode) return
    stopLocationUpdates()
    updateForegroundNotification(nextMode)
    when (nextMode) {
      TrackingMode.NAVIGATION -> startDrivingCrashDetection()
      TrackingMode.NORMAL -> stopCrashDetection()
    }
    NativeLocationModule.emitModeChange(nextMode.name)
    startLocationUpdates(nextMode)
  }

  private fun updateForegroundNotification(mode: TrackingMode) {
    val notification = when (mode) {
      TrackingMode.NAVIGATION -> buildDrivingNotification()
      TrackingMode.NORMAL -> buildForegroundNotification()
    }
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.notify(FOREGROUND_NOTIFICATION_ID, notification)
  }

  private fun startDrivingCrashDetection() {
    val intent = Intent(this, CrashDetectionService::class.java).apply {
      putExtra(CrashDetectionService.EXTRA_THRESHOLD, DRIVING_CRASH_THRESHOLD)
      putExtra(CrashDetectionService.EXTRA_COOLDOWN_MS, CRASH_COOLDOWN_MS)
      putExtra(CrashDetectionService.EXTRA_DRIVING_MODE, true)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      startForegroundService(intent)
    } else {
      startService(intent)
    }
  }

  private fun stopCrashDetection() {
    stopService(Intent(this, CrashDetectionService::class.java))
  }

  private fun stopLocationUpdates() {
    fusedClient.removeLocationUpdates(locationCallback)
  }

  private lateinit var activityPendingIntent: android.app.PendingIntent

  private fun startActivityRecognition() {
    val intent = Intent("com.project.tracknest.ACTIVITY_UPDATE")
    intent.setPackage(packageName)
    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_MUTABLE
    } else {
      android.app.PendingIntent.FLAG_UPDATE_CURRENT
    }
    activityPendingIntent = android.app.PendingIntent.getBroadcast(this, 0, intent, flags)

    try {
      activityClient.requestActivityUpdates(ACTIVITY_UPDATE_INTERVAL_MS, activityPendingIntent)
    } catch (_: SecurityException) {
    }
  }

  private fun stopActivityRecognition() {
    if (::activityPendingIntent.isInitialized) {
      activityClient.removeActivityUpdates(activityPendingIntent)
    }
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

  private fun buildDrivingNotification(): Notification {
    return NotificationCompat.Builder(this, SERVICE_CHANNEL_ID)
      .setContentTitle("Driving mode active")
      .setContentText("TrackNest is tracking your trip — crash detection enabled")
      .setSmallIcon(R.drawable.notification_icon)
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()
  }
}
