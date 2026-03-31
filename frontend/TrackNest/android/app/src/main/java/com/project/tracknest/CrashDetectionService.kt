package com.project.tracknest

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlin.math.sqrt

class CrashDetectionService : Service(), SensorEventListener {

  companion object {
    private const val SERVICE_CHANNEL_ID = "crash-detection-service"
    private const val ALERT_CHANNEL_ID = "crash-detection-alerts"
    private const val FOREGROUND_NOTIFICATION_ID = 42010
    private const val ALERT_NOTIFICATION_ID = 42011

    const val EXTRA_THRESHOLD = "threshold"
    const val EXTRA_COOLDOWN_MS = "cooldown_ms"
  }

  private lateinit var sensorManager: SensorManager
  private var threshold: Float = 3.0f
  private var cooldownMs: Long = 15_000L
  private var lastNotifiedAt: Long = 0L

  override fun onCreate() {
    super.onCreate()
    sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
    ensureChannels()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    threshold = intent?.getDoubleExtra(EXTRA_THRESHOLD, 3.0)?.toFloat() ?: 3.0f
    cooldownMs = intent?.getLongExtra(EXTRA_COOLDOWN_MS, 15_000L) ?: 15_000L

    startForeground(FOREGROUND_NOTIFICATION_ID, buildForegroundNotification())
    startAccelerometerMonitoring()

    return START_STICKY
  }

  override fun onDestroy() {
    stopAccelerometerMonitoring()
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun startAccelerometerMonitoring() {
    val accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    if (accelerometer != null) {
      sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME)
    }
  }

  private fun stopAccelerometerMonitoring() {
    sensorManager.unregisterListener(this)
  }

  override fun onSensorChanged(event: SensorEvent?) {
    val values = event?.values ?: return
    if (values.size < 3) return

    val x = values[0]
    val y = values[1]
    val z = values[2]

    val magnitude = sqrt(x * x + y * y + z * z) / SensorManager.GRAVITY_EARTH

    if (magnitude >= threshold) {
      val now = System.currentTimeMillis()
      if (now - lastNotifiedAt < cooldownMs) {
        return
      }
      lastNotifiedAt = now
      showCrashAlert(magnitude)
    }
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
  }

  private fun ensureChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    val serviceChannel = NotificationChannel(
      SERVICE_CHANNEL_ID,
      "Crash detection service",
      NotificationManager.IMPORTANCE_LOW,
    )
    serviceChannel.description = "Keeps crash detection active in background"

    val alertChannel = NotificationChannel(
      ALERT_CHANNEL_ID,
      "Crash detection alerts",
      NotificationManager.IMPORTANCE_HIGH,
    )
    alertChannel.description = "Notifications for possible crash events"

    manager.createNotificationChannel(serviceChannel)
    manager.createNotificationChannel(alertChannel)
  }

  private fun buildForegroundNotification(): Notification {
    return NotificationCompat.Builder(this, SERVICE_CHANNEL_ID)
      .setContentTitle("Crash detection active")
      .setContentText("TrackNest is monitoring for sudden impacts")
      .setSmallIcon(R.drawable.notification_icon)
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()
  }

  private fun showCrashAlert(magnitudeG: Float) {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    val notification = NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
      .setContentTitle("Possible crash detected")
      .setContentText("A sudden impact was detected (${String.format("%.1f", magnitudeG)}g). Are you okay?")
      .setSmallIcon(R.drawable.notification_icon)
      .setAutoCancel(true)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .build()

    manager.notify(ALERT_NOTIFICATION_ID, notification)
  }
}
