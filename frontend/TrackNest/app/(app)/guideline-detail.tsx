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
import { criminalReportsService } from "@/services/criminalReports";
import type { GuidelinesDocument } from "@/types/criminalReports";
import { colors, radii, spacing } from "@/styles/styles";
import { ChatbotPanel } from "@/components/shared/ChatbotPanel";

export default function GuidelineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [guideline, setGuideline] = useState<GuidelinesDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGuideline = async () => {
      if (!id) return;
      try {
        const data = await criminalReportsService.getUserGuidelinesById(id);
        setGuideline(data);
      } catch (err) {
        console.error("Failed to load guideline:", err);
      } finally {
        setLoading(false);
      }
    };

    loadGuideline();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.bgBlob} />
        <View style={styles.bgBlob2} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!guideline) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.bgBlob} />
        <View style={styles.bgBlob2} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Guideline</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.notFoundText}>Guideline not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bgBlob} />
      <View style={styles.bgBlob2} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Guideline Detail</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>{guideline.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {new Date(guideline.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          
          <View style={styles.divider} />

          <Text style={styles.abstractTitle}>Abstract</Text>
          <Text style={styles.abstractText}>{guideline.abstractText}</Text>
          
          <View style={styles.divider} />

          <Text style={styles.contentTitle}>Content</Text>
          <Text style={styles.contentText}>{guideline.content}</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Chatbot Panel */}
      <ChatbotPanel 
        documentId={guideline.content} 
        title={guideline.title} 
        emptyState="Ask a question about this guideline." 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5fafa",
  },
  bgBlob: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(52, 152, 219, 0.08)",
  },
  bgBlob2: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(46, 204, 113, 0.06)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  abstractTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  abstractText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    fontStyle: "italic",
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  contentText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 26,
  },
});
