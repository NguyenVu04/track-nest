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
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { criminalReportsService } from "@/services/criminalReports";
import type { GuidelinesDocument } from "@/types/criminalReports";
import { colors, radii, spacing } from "@/styles/styles";
import { ChatbotPanel } from "@/components/shared/ChatbotPanel";
import { showToast } from "@/utils";

// Injected JS measures the document height and posts it back so the WebView
// expands to fit its content without an internal scrollbar inside ScrollView.
const HEIGHT_SCRIPT =
  "window.ReactNativeWebView.postMessage(String(document.documentElement.scrollHeight)); true;";

export default function GuidelineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [guideline, setGuideline] = useState<GuidelinesDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [webViewHeight, setWebViewHeight] = useState(200);
  const [webViewError, setWebViewError] = useState(false);

  useEffect(() => {
    const loadGuideline = async () => {
      if (!id) return;
      try {
        const data = await criminalReportsService.getUserGuidelinesById(id);
        setGuideline(data);
        // Fetch the HTML body from MinIO via the viewer endpoint — the
        // content field on the document is a MinIO object name, not the HTML.
        try {
          const html = await criminalReportsService.getGuidelinesContent(id);
          setHtmlContent(html);
        } catch {
          // Falls back to showing abstractText as plain text below.
        }
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

  const renderContent = () => {
    if (htmlContent && !webViewError) {
      return (
        <WebView
          source={{ html: htmlContent, baseUrl: "" }}
          style={[styles.webView, { height: webViewHeight }]}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          injectedJavaScript={HEIGHT_SCRIPT}
          onMessage={(e) => {
            const h = Number(e.nativeEvent.data);
            if (h > 0) setWebViewHeight(h);
          }}
          onError={() => {
            setWebViewError(true);
            showToast("Could not load guideline content", "Error");
          }}
        />
      );
    }
    // Plain-text fallback when HTML is unavailable or fails to render.
    return (
      <Text style={styles.contentText}>
        {guideline.abstractText ?? "No content available."}
      </Text>
    );
  };

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

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
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

          {guideline.abstractText ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Abstract</Text>
              <Text style={styles.abstractText}>{guideline.abstractText}</Text>
            </>
          ) : null}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Content</Text>
          {renderContent()}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* documentId is the guideline's own ID — the backend resolves context */}
      <ChatbotPanel
        documentId={guideline.id}
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
  scroll: {
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
  sectionTitle: {
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
  contentText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  webView: {
    width: "100%",
    backgroundColor: "transparent",
  },
});
