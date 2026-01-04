import {
  useLocationStream,
  useTargetLocations,
} from "@/hooks/useTrackerService";
import React, { useEffect } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

/**
 * Example component showing how to use the tracker proto service
 *
 * This demonstrates:
 * 1. Streaming your location to the server
 * 2. Receiving real-time location updates from tracked targets
 */
export function TrackerExample() {
  // Enable location streaming when user enables sharing
  const sharingEnabled = true; // This would come from your app state

  // Hook to stream your location to the server
  const {
    isStreaming,
    error: streamError,
    sendLocation,
  } = useLocationStream(sharingEnabled);

  // Hook to receive location updates from all targets
  const {
    locations,
    isConnected,
    error: targetError,
  } = useTargetLocations(true);

  // Example: Send location updates every 5 seconds
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      // Get current location (replace with actual location from GPS)
      const latitude = 10.762622; // Example coordinates
      const longitude = 106.660172;
      const accuracy = 10; // meters
      const velocity = 0; // m/s

      sendLocation(latitude, longitude, accuracy, velocity);
      console.log("Location sent to server");
    }, 5000);

    return () => clearInterval(interval);
  }, [isStreaming, sendLocation]);

  // Handle errors
  useEffect(() => {
    if (streamError) {
      Alert.alert("Stream Error", streamError);
    }
    if (targetError) {
      Alert.alert("Target Error", targetError);
    }
  }, [streamError, targetError]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tracker Service Status</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Location Stream:</Text>
        <Text style={styles.value}>
          {isStreaming ? "✓ Active" : "✗ Inactive"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Target Connection:</Text>
        <Text style={styles.value}>
          {isConnected ? "✓ Connected" : "✗ Disconnected"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tracked Targets:</Text>
        <Text style={styles.value}>{locations.length}</Text>
      </View>

      {locations.map((location) => (
        <View key={location.userid} style={styles.locationCard}>
          <Text style={styles.username}>{location.username}</Text>
          <Text style={styles.coordinates}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(location.timestamp * 1000).toLocaleTimeString()}
          </Text>
          <Text style={styles.status}>
            {location.connected ? "🟢 Online" : "🔴 Offline"}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
  },
  locationCard: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    color: "#666",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  status: {
    fontSize: 12,
    marginTop: 4,
  },
});
