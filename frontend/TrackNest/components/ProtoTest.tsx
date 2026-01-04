/**
 * Simple test to verify tracker.proto integration
 *
 * Add this component temporarily to test the setup before full integration
 */

import { LocationRequest, LocationResponse } from "@/proto/gen/tracker_pb";
import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export function ProtoTest() {
  const testMessageCreation = () => {
    // Test creating a LocationRequest message
    const request = new LocationRequest();
    request.setLatitude(10.762622);
    request.setLongitude(106.660172);
    request.setTimestamp(Math.floor(Date.now() / 1000));
    request.setAccuracy(10);
    request.setVelocity(0);

    const obj = request.toObject();
    console.log("✅ LocationRequest created:", obj);
    alert(
      `LocationRequest created:\nLat: ${obj.latitude}\nLon: ${obj.longitude}`
    );
  };

  const testMessageParsing = () => {
    // Test creating a LocationResponse message
    const response = new LocationResponse();
    response.setId("test-123");
    response.setUserid("user-456");
    response.setUsername("Test User");
    response.setLatitude(10.762622);
    response.setLongitude(106.660172);
    response.setTimestamp(Math.floor(Date.now() / 1000));
    response.setAccuracy(10);
    response.setVelocity(0);
    response.setConnected(true);

    const obj = response.toObject();
    console.log("✅ LocationResponse created:", obj);
    alert(
      `LocationResponse parsed:\nUser: ${obj.username}\nConnected: ${obj.connected}`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Proto Message Test</Text>
      <Text style={styles.subtitle}>
        This tests that tracker.proto messages are working correctly
      </Text>

      <View style={styles.buttonContainer}>
        <Button title="Test LocationRequest" onPress={testMessageCreation} />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Test LocationResponse" onPress={testMessageParsing} />
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          ✅ If you can click these buttons without errors,{"\n"}
          your proto integration is working!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  buttonContainer: {
    marginVertical: 8,
  },
  info: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#2e7d32",
    textAlign: "center",
  },
});
