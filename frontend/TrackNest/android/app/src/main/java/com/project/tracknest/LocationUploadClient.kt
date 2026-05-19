package com.project.tracknest

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import project.tracknest.usertracking.proto.lib.UpdateUserLocationRequest
import project.tracknest.usertracking.proto.lib.UserLocation
import java.nio.ByteBuffer
import java.util.concurrent.TimeUnit

/**
 * Singleton gRPC-Web client for uploading location batches directly from the
 * native foreground service, bypassing the React Native bridge and the
 * expo-background-task 15-minute interval.
 *
 * Sends gRPC-Web (HTTP/1.1) requests to Envoy, which translates them to native
 * gRPC (HTTP/2) before forwarding to user-tracking. This matches the protocol
 * used by the JS gRPC clients in the mobile app.
 *
 * Auth token and server URL are written to SharedPreferences by the React
 * Native layer (via NativeLocationModule.setAuthToken / setGrpcUrl). The URL
 * is also read directly from AsyncStorage using the same key as the JS side
 * (@tracknest/grpc_url), with SharedPreferences as the fallback.
 */
object LocationUploadClient {

    private const val TAG = "LocationUploadClient"
    private const val PREFS_NAME = "tracknest_native_location"
    private const val TOKEN_KEY = "jwt_token"

    // SharedPreferences key — kept for backward-compatibility with setGrpcUrl().
    private const val URL_PREFS_KEY = "grpc_url"

    // AsyncStorage key — mirrors GRPC_URL_KEY in utils/serviceUrl.ts.
    private const val ASYNC_STORAGE_GRPC_KEY = "@tracknest/grpc_url"

    // Emulator default: host machine on port 8800 (Envoy gRPC-Web bridge).
    private const val DEFAULT_URL = "http://10.0.2.2:8800"

    private const val METHOD_PATH =
        "/project.tracknest.usertracking.proto.v1.TrackerController/UpdateUserLocation"

    private const val UPLOAD_CHANNEL_ID = "location-upload-status"
    private const val UPLOAD_NOTIFICATION_ID = 43011

    private val GRPC_WEB_MEDIA_TYPE = "application/grpc-web+proto".toMediaType()

    private val httpClient = OkHttpClient.Builder()
        .callTimeout(15, TimeUnit.SECONDS)
        .build()

    data class LocationEntry(
        val latitude: Double,
        val longitude: Double,
        val accuracy: Double,
        val speed: Double,
        val timestamp: Long,
        val timeSpentMs: Long = 0L,
    )

    /**
     * Reads the gRPC URL from AsyncStorage SQLite, which is the same store the
     * JS side writes to via getGrpcUrl() / AsyncStorage.setItem(GRPC_URL_KEY, …).
     * Tries both "RKStorage" (React Native old arch) and "AsyncStorage" (new arch)
     * database names. Returns null if the key is not set or the DB is unavailable.
     */
    private fun readGrpcUrlFromAsyncStorage(context: Context): String? {
        for (dbName in listOf("RKStorage", "AsyncStorage")) {
            try {
                val db = context.openOrCreateDatabase(dbName, Context.MODE_PRIVATE, null)
                val value = db.rawQuery(
                    "SELECT value FROM catalystLocalStorage WHERE key=?",
                    arrayOf(ASYNC_STORAGE_GRPC_KEY)
                ).use { cursor ->
                    if (cursor.moveToFirst()) cursor.getString(0) else null
                }
                db.close()
                val trimmed = value?.trim()
                if (!trimmed.isNullOrBlank()) return trimmed
            } catch (_: Exception) {}
        }
        return null
    }

    private fun ensureUploadChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(UPLOAD_CHANNEL_ID) != null) return
        val channel = NotificationChannel(
            UPLOAD_CHANNEL_ID,
            "Location upload status",
            NotificationManager.IMPORTANCE_LOW,
        ).apply { description = "Shows whether location data was successfully uploaded to the server" }
        manager.createNotificationChannel(channel)
    }

    private fun postUploadNotification(
        context: Context,
        success: Boolean,
        count: Int,
        reason: String? = null,
    ) {
        ensureUploadChannel(context)
        val title = if (success) "Location uploaded" else "Location upload failed"
        val body = if (success) "$count fix(es) sent to server" else (reason ?: "Unknown error")
        val notification = NotificationCompat.Builder(context, UPLOAD_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(R.drawable.notification_icon)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(UPLOAD_NOTIFICATION_ID, notification)
    }

    /**
     * Uploads [locations] to the user-tracking gRPC service via gRPC-Web.
     * Must be called from a background thread — uses a blocking OkHttp call.
     *
     * URL resolution order:
     *   1. AsyncStorage key "@tracknest/grpc_url" (same as JS getGrpcUrl())
     *   2. SharedPreferences "grpc_url" (written by NativeLocationModule.setGrpcUrl())
     *   3. DEFAULT_URL ("http://10.0.2.2:8800" for the Android emulator)
     *
     * Posts a system notification after every attempt (success or failure).
     */
    fun upload(context: Context, locations: List<LocationEntry>) {
        if (locations.isEmpty()) return

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val token = prefs.getString(TOKEN_KEY, null)
        if (token.isNullOrBlank()) {
            Log.d(TAG, "No auth token — skipping upload")
            return
        }

        val baseUrl = (readGrpcUrlFromAsyncStorage(context)
            ?: prefs.getString(URL_PREFS_KEY, DEFAULT_URL)
            ?: DEFAULT_URL).trimEnd('/')

        try {
            val userLocations = locations.map { entry ->
                UserLocation.newBuilder()
                    .setLatitudeDeg(entry.latitude)
                    .setLongitudeDeg(entry.longitude)
                    .setAccuracyMeter(entry.accuracy.toFloat())
                    .setVelocityMps(entry.speed.toFloat())
                    .setTimestampMs(entry.timestamp)
                    .setTimeSpentMs(entry.timeSpentMs)
                    .build()
            }

            val requestProto = UpdateUserLocationRequest.newBuilder()
                .addAllLocations(userLocations)
                .build()

            val body = wrapGrpcWebFrame(requestProto.toByteArray())
                .toRequestBody(GRPC_WEB_MEDIA_TYPE)

            val request = Request.Builder()
                .url("$baseUrl$METHOD_PATH")
                .post(body)
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Accept", "application/grpc-web+proto")
                .addHeader("X-Grpc-Web", "1")
                .build()

            httpClient.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    Log.d(TAG, "Uploaded ${locations.size} location(s) via gRPC-Web")
                    postUploadNotification(context, success = true, count = locations.size)
                } else {
                    val reason = "HTTP ${response.code}: ${response.message}"
                    Log.w(TAG, "gRPC-Web upload $reason")
                    postUploadNotification(context, success = false, count = 0, reason = reason)
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "gRPC-Web upload failed: ${e.message}")
            postUploadNotification(context, success = false, count = 0, reason = e.message)
        }
    }

    /** Wraps protobuf bytes in a gRPC-Web data frame: [0x00][4-byte big-endian length][data]. */
    private fun wrapGrpcWebFrame(protoBytes: ByteArray): ByteArray =
        ByteBuffer.allocate(5 + protoBytes.size).apply {
            put(0x00) // compression flag: not compressed
            putInt(protoBytes.size)
            put(protoBytes)
        }.array()

    /** No-op kept for API compatibility — OkHttp client is connection-less. */
    fun resetChannel() = Unit
}
