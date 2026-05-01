import { useSettings } from "@/contexts/SettingsContext";
import { voiceTest as voiceTestLang } from "@/constant/languages";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { showToast } from "@/utils";

const VoiceTestScreen = () => {
  const router = useRouter();
  const t = useTranslation(voiceTestLang);
  const { checkForSOSCommand, voiceSettings } = useSettings();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState("");
  const [allResults, setAllResults] = useState<string[]>([]);

  const stopListening = useCallback(async () => {
    try {
      setIsListening(false);
      ExpoSpeechRecognitionModule.stop();
    } catch (err) {
      setError(t.errorStoppingRecording);
    }
  }, [t.errorStoppingRecording]);

  const startListening = useCallback(async () => {
    try {
      // Check if speech recognition is available
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        showToast(t.notAvailableMessage, t.notAvailable);
        return;
      }

      // Request microphone permissions
      const permission =
        await ExpoSpeechRecognitionModule.getMicrophonePermissionsAsync();

      if (!permission.granted) {
        if (permission.canAskAgain) {
          const requested =
            await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
          if (!requested.granted) {
            showToast(t.permissionDeniedMessage, t.permissionDenied);
            return;
          }
        } else {
          showToast(t.permissionRequiredMessage, t.permissionRequired);
          return;
        }
      }

      // Check current state before starting
      const state = await ExpoSpeechRecognitionModule.getStateAsync();
      if (state === "recognizing" || state === "starting") {
        setError(t.alreadyRecording);
        return;
      }

      setError("");
      setTranscript("");
      setInterimTranscript("");
      setIsListening(true);

      // Start listening
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false, // Stop after one phrase
      });
    } catch (err: any) {
      setError(`${t.failedToStart}: ${err.message}`);
      setIsListening(false);
    }
  }, [
    t.alreadyRecording,
    t.failedToStart,
    t.notAvailable,
    t.notAvailableMessage,
    t.permissionDenied,
    t.permissionDeniedMessage,
    t.permissionRequired,
    t.permissionRequiredMessage,
  ]);

  // Handle incoming results
  useSpeechRecognitionEvent("result", async (event) => {
    const result = event.results[0];
    if (!result) return;

    const transcriptText = result.transcript;
    setTranscript(transcriptText);
    setAllResults((prev) => [...prev, transcriptText]);
    setInterimTranscript(transcriptText);

    // Check if this is an SOS command
    if (voiceSettings.enabled) {
      const isSOS = await checkForSOSCommand(transcriptText);
      if (isSOS) {
        // Navigate to SOS screen with auto-activate
        router.push("/sos?autoActivate=true");
      }
    }
  });

  // Handle errors
  useSpeechRecognitionEvent("error", (event) => {
    setError(`${t.errorPrefix}: ${event.error}`);
    setIsListening(false);
  });

  // Handle end of recognition
  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
  });

  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [isListening, stopListening]);

  const clearHistory = () => {
    setAllResults([]);
    setTranscript("");
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons name="mic" size={32} color="#74becb" />
          <Text style={styles.title}>{t.title}</Text>
        </View>

        {/* Recording Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>{t.statusLabel}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor: isListening ? "#ef4444" : "#9ca3af",
                },
              ]}
            />
            <Text style={styles.statusText}>
              {isListening ? t.statusRecording : t.statusReady}
            </Text>
          </View>
        </View>

        {/* Main Recording Button */}
        <TouchableOpacity
          style={[
            styles.recordButton,
            isListening && styles.recordButtonActive,
          ]}
          onPress={isListening ? stopListening : startListening}
          disabled={false}
        >
          {isListening ? (
            <>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.recordButtonText}>{t.stopRecording}</Text>
            </>
          ) : (
            <>
              <Ionicons name="mic-circle" size={48} color="#fff" />
              <Text style={styles.recordButtonText}>{t.startRecording}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Current Transcript */}
        {(transcript || interimTranscript) && (
          <View style={styles.transcriptCard}>
            <Text style={styles.transcriptLabel}>{t.currentResult}</Text>
            {interimTranscript && (
              <Text style={styles.interimTranscript}>{interimTranscript}</Text>
            )}
            {transcript && (
              <Text style={styles.finalTranscript}>{transcript}</Text>
            )}
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Recording History */}
        {allResults.length > 0 && (
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>{t.recordingHistory}</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Ionicons name="trash-outline" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </View>
            {allResults.map((result, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyIndex}>{index + 1}.</Text>
                <Text style={styles.historyText} numberOfLines={2}>
                  {result}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t.howToUse}</Text>
          <Text style={styles.infoText}>
            {t.howToUseSteps
              .replace("{newline}", "\n")
              .replace("{newline}", "\n")
              .replace("{newline}", "\n")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
    marginTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 12,
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  recordButton: {
    backgroundColor: "#74becb",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: "#ef4444",
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginTop: 12,
  },
  transcriptCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#74becb",
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  interimTranscript: {
    fontSize: 16,
    color: "#999",
    fontStyle: "italic",
    marginBottom: 8,
  },
  finalTranscript: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
    lineHeight: 24,
  },
  errorCard: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    fontSize: 14,
    color: "#b91c1c",
    flex: 1,
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  historyItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 8,
  },
  historyIndex: {
    fontSize: 14,
    fontWeight: "600",
    color: "#74becb",
    minWidth: 24,
  },
  historyText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  infoCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#74becb",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0c4a6e",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#0c4a6e",
    lineHeight: 20,
  },
});

export default VoiceTestScreen;
