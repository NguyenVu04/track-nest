package com.project.tracknest

import android.content.Context
import android.util.Log
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
 * Native layer (via NativeLocationModule.setAuthToken / setGrpcUrl).
 */
object LocationUploadClient {

    private const val TAG = "LocationUploadClient"
    private const val PREFS_NAME = "tracknest_native_location"
    private const val TOKEN_KEY = "jwt_token"
    private const val URL_KEY = "grpc_url"

    // Emulator default: host machine on port 8800 (Envoy gRPC-Web bridge).
    private const val DEFAULT_URL = "http://10.0.2.2:8800"

    private const val METHOD_PATH =
        "/project.tracknest.usertracking.proto.v1.TrackerController/UpdateUserLocation"

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
     * Uploads [locations] to the user-tracking gRPC service via gRPC-Web.
     * Must be called from a background thread — uses a blocking OkHttp call.
     * Silently swallows network errors; the React-side background task
     * retries any unsent buffered locations.
     */
    fun upload(context: Context, locations: List<LocationEntry>) {
        if (locations.isEmpty()) return

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val token = prefs.getString(TOKEN_KEY, null)
        if (token.isNullOrBlank()) {
            Log.d(TAG, "No auth token — skipping upload")
            return
        }

        val baseUrl = (prefs.getString(URL_KEY, DEFAULT_URL) ?: DEFAULT_URL).trimEnd('/')

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
                } else {
                    Log.w(TAG, "gRPC-Web upload HTTP ${response.code}: ${response.message}")
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "gRPC-Web upload failed: ${e.message}")
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
