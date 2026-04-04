import { settings as settingsLang } from "@/constant/languages";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useTranslation } from "@/hooks/useTranslation";
import { useVoiceSosActivation } from "@/hooks/useVoiceSosActivation";
import { colors, radii, spacing } from "@/styles/styles";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import fetch from "cross-fetch"; // polyfill for RN
import { Redirect, Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

global.fetch = global.fetch || fetch;

export default function AppLayout() {
  const { isAuthenticated, isGuestMode, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslation(settingsLang);
  const promptOpenRef = useRef(false);
  const guestLoginSheetRef = useRef<BottomSheetModal>(null);

  usePushNotifications(isAuthenticated);
  useVoiceSosActivation(isAuthenticated || __DEV__);

  useEffect(() => {
    if (!isGuestMode || isAuthenticated || isLoading) {
      promptOpenRef.current = false;
      guestLoginSheetRef.current?.dismiss();
      return;
    }

    const showPrompt = () => {
      if (promptOpenRef.current) return;
      promptOpenRef.current = true;
      guestLoginSheetRef.current?.present();
    };

    const initialTimer = setTimeout(showPrompt, 1000);
    const intervalTimer = setInterval(showPrompt, 300000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      promptOpenRef.current = false;
    };
  }, [isGuestMode, isAuthenticated, isLoading, router, t]);

  const closeGuestLoginSheet = () => {
    promptOpenRef.current = false;
    guestLoginSheetRef.current?.dismiss();
  };

  const goToLogin = () => {
    closeGuestLoginSheet();
    router.push("/auth/login");
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.35}
        pressBehavior="close"
      />
    ),
    [],
  );

  if (isLoading) return null;

  if (!isAuthenticated && !isGuestMode && !__DEV__) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="family-circles/new" />
          <Stack.Screen name="location-history" />
          <Stack.Screen name="manage-trackers" />
          <Stack.Screen name="safe-zones" />
          <Stack.Screen name="crime-heatmap" />
          <Stack.Screen name="missing-detail" />
          <Stack.Screen name="report-detail" />
          <Stack.Screen name="create-report" />
          <Stack.Screen
            name="sos"
            options={{
              gestureEnabled: false,
              animation: "none",
              headerBackVisible: false,
            }}
          />
        </Stack>

        <BottomSheetModal
          ref={guestLoginSheetRef}
          index={0}
          snapPoints={["38%"]}
          backdropComponent={renderBackdrop}
          enablePanDownToClose
          onChange={(index) => {
            if (index < 0) {
              promptOpenRef.current = false;
            }
          }}
        >
          <BottomSheetView style={styles.sheetContainer}>
            <Text style={styles.sheetTitle}>{t.guestModePromptTitle}</Text>
            <Text style={styles.sheetMessage}>{t.guestModePromptMessage}</Text>

            <Pressable style={styles.loginButton} onPress={goToLogin}>
              <Text style={styles.loginButtonText}>{t.loginNowButton}</Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={closeGuestLoginSheet}
            >
              <Text style={styles.cancelButtonText}>{t.cancelButton}</Text>
            </Pressable>
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + spacing.xs,
    gap: spacing.xs,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sheetMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: "center",
    marginBottom: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 15,
  },
});
