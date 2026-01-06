import { MissingPerson, MOCK_MISSING } from "@/services/reports";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock function to get a missing person by ID
async function getMissingPersonById(
  id: string
): Promise<MissingPerson | undefined> {
  

  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_MISSING.find((m) => m.id === id)), 200);
  });
}

export default function MissingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [person, setPerson] = useState<MissingPerson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPerson = async () => {
      if (!id) return;
      try {
        const data = await getMissingPersonById(id);
        setPerson(data || null);
      } catch (err) {
        console.error("Failed to load missing person:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPerson();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#0b62ff" />
        </View>
      </SafeAreaView>
    );
  }

  if (!person) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push("/(tabs)/reports")}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Missing Person Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 16, color: "#666" }}>Person not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Missing Person</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.detailCard}>
          <View style={styles.titleRow}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Ionicons name="search" size={28} color="#ff4d4f" />
              <Text style={styles.title}>{person.name}</Text>
            </View>
            <View
              style={[
                styles.severityChip,
                person.severity === "High"
                  ? styles.sevHigh
                  : person.severity === "Medium"
                  ? styles.sevMed
                  : styles.sevLow,
              ]}
            >
              <Text style={styles.severityText}>{person.severity}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#0b62ff" />
              <Text style={styles.infoText}>Age: {person.age} years old</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Seen</Text>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color="#0b62ff" />
              <Text style={styles.infoText}>{person.lastSeen}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Physical Description</Text>
            <Text style={styles.description}>{person.description}</Text>
          </View>

          <View style={styles.actionButtons}>
            <Pressable style={[styles.button, styles.callButton]}>
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.buttonText}>Call Police</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.shareButton]}>
              <Ionicons name="share-social" size={20} color="#0b62ff" />
              <Text style={[styles.buttonText, { color: "#0b62ff" }]}>
                Share
              </Text>
            </Pressable>
          </View>

          <Pressable style={styles.tipButton}>
            <Ionicons name="information-circle" size={20} color="#fff" />
            <Text style={styles.tipButtonText}>Send a Tip</Text>
          </Pressable>
        </View>
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
    height: 56,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    flex: 1,
  },
  severityChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  severityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sevHigh: {
    backgroundColor: "#ffd6d6",
  },
  sevMed: {
    backgroundColor: "#fff0d6",
  },
  sevLow: {
    backgroundColor: "#f2fff0",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: "#555",
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  callButton: {
    backgroundColor: "#ff4d4f",
  },
  shareButton: {
    backgroundColor: "#f0f0f0",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 14,
    color: "#fff",
  },
  tipButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#0b62ff",
    borderRadius: 10,
    gap: 8,
  },
  tipButtonText: {
    fontWeight: "600",
    fontSize: 14,
    color: "#fff",
  },
});
