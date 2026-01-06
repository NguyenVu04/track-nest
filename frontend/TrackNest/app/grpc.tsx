import React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  fetchHistoryForTarget,
  startLastLocationsStream,
} from "@/services/tracker";
import fetch from "cross-fetch"; // polyfill for RN
import { SafeAreaView } from "react-native-safe-area-context";

global.fetch = global.fetch || fetch;
export default function GrpcDemoScreen() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <View style={styles.titleContainer}>
        <Text>Tracker Demo</Text>
      </View>

      <View style={styles.stepContainer}>
        <Text onPress={startLastLocationsStream}>▶ Stream Last Locations</Text>
        <Text
          onPress={() =>
            fetchHistoryForTarget("dd382dcf-3652-499c-acdb-5d9ce99a67b8")
          }
        >
          ▶ Stream History for user
        </Text>
      </View>

      {/* <View style={styles.stepContainer}>
        <Text>Received Messages</Text>
        {locations.map((loc, i) => (
          <Text key={i}>{JSON.stringify(loc)}</Text>
        ))}
      </View> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepContainer: { gap: 8, marginBottom: 8 },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
