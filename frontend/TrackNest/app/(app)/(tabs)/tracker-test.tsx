import type { ClientReadableStream } from "grpc-web";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FamilyMemberLocation } from "@/proto/tracker_pb";
import {
  listFamilyMemberLocationHistory,
  streamFamilyMemberLocations,
  updateUserLocation,
} from "@/services/tracker";
import { colors, spacing } from "@/styles/styles";
import { BACKGROUND_CIRCLE_LOCATION_TASK_NAME } from "@/constant";
import { registerBackgroundTaskAsync, unregisterBackgroundTaskAsync } from "@/utils";

export default function TrackerTestScreen() {
  // Stream state
  const [familyCircleId, setFamilyCircleId] = useState(
    "cccccccc-1000-4000-8000-cccccccccccc",
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedLocations, setStreamedLocations] = useState<
    FamilyMemberLocation.AsObject[]
  >([]);
  const streamRef = useRef<ClientReadableStream<FamilyMemberLocation> | null>(
    null,
  );

  // History state
  const [historyCircleId, setHistoryCircleId] = useState(
    "cccccccc-1000-4000-8000-cccccccccccc",
  );
  const [memberId, setMemberId] = useState(
    "2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5",
  );
  const [memberUsername, setMemberUsername] = useState("user4");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyLocations, setHistoryLocations] = useState<any[]>([]);

  // Update location state
  const [latitude, setLatitude] = useState("10.7721");
  const [longitude, setLongitude] = useState("106.6579");
  const [accuracy, setAccuracy] = useState("10");
  const [velocity, setVelocity] = useState("0");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);

  // Stream family member locations
  const handleStartStream = useCallback(async () => {
    if (!familyCircleId.trim()) {
      Alert.alert("Error", "Please enter a Family Circle ID");
      return;
    }

    try {
      setIsStreaming(true);
      setStreamedLocations([]);

      const stream = await streamFamilyMemberLocations(
        familyCircleId,
        (location) => {
          setStreamedLocations((prev) => [...prev, location]);
        },
        (err) => {
          Alert.alert("Stream Error", err.message);
          setIsStreaming(false);
        },
        () => {
          setIsStreaming(false);
        },
      );

      streamRef.current = stream;
    } catch (error: any) {
      Alert.alert("Error", error.message);
      setIsStreaming(false);
    }
  }, [familyCircleId]);

  const handleStopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.cancel();
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Fetch location history
  const handleFetchHistory = useCallback(async () => {
    if (!historyCircleId.trim() || !memberId.trim() || !memberUsername.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      setIsLoadingHistory(true);
      setHistoryLocations([]);

      const response = await listFamilyMemberLocationHistory(
        historyCircleId,
        memberId,
        memberUsername,
      );

      setHistoryLocations(response.locationsList);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [historyCircleId, memberId, memberUsername]);

  // Update user location
  const handleUpdateLocation = useCallback(async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const acc = parseFloat(accuracy);
    const vel = parseFloat(velocity);

    if (isNaN(lat) || isNaN(lng) || isNaN(acc) || isNaN(vel)) {
      Alert.alert("Error", "Please enter valid numeric values");
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateResult(null);

      const response = await updateUserLocation(lat, lng, acc, vel);
      setUpdateResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsUpdating(false);
    }
  }, [latitude, longitude, accuracy, velocity]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Tracker Service Test</Text>

        <Pressable
          style={{ marginBottom: 20, padding: 10, backgroundColor: "#eee" }}
          onPress={() =>
            registerBackgroundTaskAsync(BACKGROUND_CIRCLE_LOCATION_TASK_NAME)
          }
        >
          <Text>Start</Text>
        </Pressable>

        <Pressable
          style={{ marginBottom: 20, padding: 10, backgroundColor: "#eee" }}
          onPress={() =>
            unregisterBackgroundTaskAsync(BACKGROUND_CIRCLE_LOCATION_TASK_NAME)
          }
        >
          <Text>Stop</Text>
        </Pressable>

        {/* Stream Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Stream Family Member Locations
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Family Circle ID"
            placeholderTextColor={colors.textMuted}
            value={familyCircleId}
            onChangeText={setFamilyCircleId}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, isStreaming && styles.buttonDisabled]}
              onPress={handleStartStream}
              disabled={isStreaming}
            >
              <Text style={styles.buttonText}>Start Stream</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonDanger,
                !isStreaming && styles.buttonDisabled,
              ]}
              onPress={handleStopStream}
              disabled={!isStreaming}
            >
              <Text style={styles.buttonText}>Stop Stream</Text>
            </TouchableOpacity>
          </View>
          {isStreaming && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.statusText}>Streaming...</Text>
            </View>
          )}
          {streamedLocations.length > 0 && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>
                Received Locations ({streamedLocations.length}):
              </Text>
              {streamedLocations.slice(-5).map((loc, i) => (
                <Text key={i} style={styles.resultText}>
                  {JSON.stringify(loc, null, 2)}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fetch Location History</Text>
          <TextInput
            style={styles.input}
            placeholder="Family Circle ID"
            placeholderTextColor={colors.textMuted}
            value={historyCircleId}
            onChangeText={setHistoryCircleId}
          />
          <TextInput
            style={styles.input}
            placeholder="Member ID"
            placeholderTextColor={colors.textMuted}
            value={memberId}
            onChangeText={setMemberId}
          />
          <TextInput
            style={styles.input}
            placeholder="Member Username"
            placeholderTextColor={colors.textMuted}
            value={memberUsername}
            onChangeText={setMemberUsername}
          />
          <TouchableOpacity
            style={[styles.button, isLoadingHistory && styles.buttonDisabled]}
            onPress={handleFetchHistory}
            disabled={isLoadingHistory}
          >
            {isLoadingHistory ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Fetch History</Text>
            )}
          </TouchableOpacity>
          {historyLocations.length > 0 && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>
                History ({historyLocations.length} locations):
              </Text>
              {historyLocations.slice(0, 5).map((loc, i) => (
                <Text key={i} style={styles.resultText}>
                  {JSON.stringify(loc, null, 2)}
                </Text>
              ))}
              {historyLocations.length > 5 && (
                <Text style={styles.moreText}>
                  ... and {historyLocations.length - 5} more
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Update Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update User Location</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="Latitude"
              placeholderTextColor={colors.textMuted}
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="Longitude"
              placeholderTextColor={colors.textMuted}
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="Accuracy (m)"
              placeholderTextColor={colors.textMuted}
              value={accuracy}
              onChangeText={setAccuracy}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="Velocity (m/s)"
              placeholderTextColor={colors.textMuted}
              value={velocity}
              onChangeText={setVelocity}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonSuccess,
              isUpdating && styles.buttonDisabled,
            ]}
            onPress={handleUpdateLocation}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Update Location</Text>
            )}
          </TouchableOpacity>
          {updateResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Response:</Text>
              <Text style={styles.resultText}>{updateResult}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inputHalf: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statusText: {
    color: colors.primary,
    fontSize: 14,
  },
  resultBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resultText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  moreText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: "italic",
  },
});
