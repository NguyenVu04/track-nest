package com.project.tracknest

import android.content.Context
import android.util.Log
import io.grpc.ManagedChannel
import io.grpc.ManagedChannelBuilder
import io.grpc.Metadata
import io.grpc.stub.MetadataUtils
import project.tracknest.usertracking.proto.lib.TrackerControllerGrpc
import project.tracknest.usertracking.proto.lib.UpdateUserLocationRequest
import project.tracknest.usertracking.proto.lib.UserLocation
import java.util.concurrent.TimeUnit

/**
 * Singleton gRPC client for uploading location batches directly from the
 * native foreground service, bypassing the React Native bridge and the
 * expo-background-task 15-minute interval.
 *
 * Auth token and server URL are written to SharedPreferences by the React
 * Native layer (via NativeLocationModule.setAuthToken / setGrpcUrl).
 *
 * The channel is plaintext because Envoy (or the dev server) terminates TLS
 * upstream. Call resetChannel() when the token or URL changes.
 */
object LocationUploadClient {

    private const val TAG = "LocationUploadClient"

    private const val PREFS_NAME  = "tracknest_native_location"
    private const val TOKEN_KEY   = "jwt_token"
    private const val HOST_KEY    = "grpc_host"
    private const val PORT_KEY    = "grpc_port"

    // Defaults: Android emulator → host machine on port 8800 (Envoy).
    private const val DEFAULT_HOST = "10.0.2.2"
    private const val DEFAULT_PORT = 8800

    @Volatile private var channel: ManagedChannel? = null
    @Volatile private var channelHost: String = ""
    @Volatile private var channelPort: Int = 0

    data class LocationEntry(
        val latitude: Double,
        val longitude: Double,
        val accuracy: Double,
        val speed: Double,
        val timestamp: Long,
    )

    /**
     * Uploads [locations] to the user-tracking gRPC service.
     * Must be called from a background thread — uses a blocking stub.
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

        val host = prefs.getString(HOST_KEY, DEFAULT_HOST) ?: DEFAULT_HOST
        val port = prefs.getInt(PORT_KEY, DEFAULT_PORT)

        try {
            val ch = getOrCreateChannel(host, port)

            val authKey = Metadata.Key.of("Authorization", Metadata.ASCII_STRING_MARSHALLER)
            val metadata = Metadata().apply { put(authKey, "Bearer $token") }

            val stub = MetadataUtils.attachHeaders(
                TrackerControllerGrpc.newBlockingStub(ch)
                    .withDeadlineAfter(10, TimeUnit.SECONDS),
                metadata,
            )

            val userLocations = locations.map { entry ->
                UserLocation.newBuilder()
                    .setLatitudeDeg(entry.latitude)
                    .setLongitudeDeg(entry.longitude)
                    .setAccuracyMeter(entry.accuracy.toFloat())
                    .setVelocityMps(entry.speed.toFloat())
                    .setTimestampMs(entry.timestamp)
                    .build()
            }

            val request = UpdateUserLocationRequest.newBuilder()
                .addAllLocations(userLocations)
                .build()

            stub.updateUserLocation(request)
            Log.d(TAG, "Uploaded ${locations.size} location(s) via gRPC")
        } catch (e: Exception) {
            Log.w(TAG, "gRPC upload failed: ${e.message}")
        }
    }

    private fun getOrCreateChannel(host: String, port: Int): ManagedChannel {
        val existing = channel
        if (existing != null && !existing.isShutdown && host == channelHost && port == channelPort) {
            return existing
        }
        return synchronized(this) {
            val checked = channel
            if (checked != null && !checked.isShutdown && host == channelHost && port == channelPort) {
                checked
            } else {
                checked?.shutdownNow()
                ManagedChannelBuilder
                    .forAddress(host, port)
                    .usePlaintext()
                    .build()
                    .also {
                        channel = it
                        channelHost = host
                        channelPort = port
                    }
            }
        }
    }

    /** Call when auth token or server URL changes so the next upload reconnects. */
    fun resetChannel() {
        synchronized(this) {
            channel?.shutdownNow()
            channel = null
            channelHost = ""
            channelPort = 0
        }
    }
}
