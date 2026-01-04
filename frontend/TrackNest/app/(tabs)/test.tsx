import { ProtoTest } from "@/components/ProtoTest";
import { TrackerExample } from "@/components/TrackerExample";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TestMode = "proto" | "tracker";

export default function TestScreen() {
  const [mode, setMode] = useState<TestMode>("proto");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>gRPC Testing</Text>
        <Text style={styles.subtitle}>Test your tracker proto integration</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, mode === "proto" && styles.tabActive]}
          onPress={() => setMode("proto")}
        >
          <Text
            style={[styles.tabText, mode === "proto" && styles.tabTextActive]}
          >
            Proto Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, mode === "tracker" && styles.tabActive]}
          onPress={() => setMode("tracker")}
        >
          <Text
            style={[styles.tabText, mode === "tracker" && styles.tabTextActive]}
          >
            Tracker Service
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {mode === "proto" ? <ProtoTest /> : <TrackerExample />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    backgroundColor: "#0b62ff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#e3f2ff",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#0b62ff",
    backgroundColor: "#fff",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  tabTextActive: {
    color: "#0b62ff",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
});
