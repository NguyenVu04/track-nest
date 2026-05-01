import { BACKGROUND_LOCATION_UPLOAD_TASK_NAME, BACKGROUND_NOTIFICATION_TASK_NAME } from "@/constant";
import { useAuth } from "@/contexts/AuthContext";
import { registerBackgroundTaskAsync } from "@/utils";
import { setupUploadNotificationChannel } from "@/utils/notifications";
import { hasCompletedIntroWalkthrough } from "@/utils/walkthrough";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isAuthenticated, isGuestMode, isLoading } = useAuth();
  const [isIntroStateLoading, setIsIntroStateLoading] = useState(true);
  const [hasCompletedIntro, setHasCompletedIntro] = useState(false);

  const requestBackgroundLocationPermission = async () => {
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== "granted") {
      console.warn("Foreground location permission not granted");
      return;
    }

    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("Background location permission not granted");
    }
  };

  useEffect(() => {
    let isMounted = true;

    hasCompletedIntroWalkthrough()
      .then((completed) => {
        if (!isMounted) return;
        setHasCompletedIntro(completed);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsIntroStateLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isIntroStateLoading || !hasCompletedIntro) return;

    requestBackgroundLocationPermission();
    // Register the background upload task so expo-background-task can invoke it
    // periodically while the app is backgrounded.
    registerBackgroundTaskAsync(BACKGROUND_LOCATION_UPLOAD_TASK_NAME).catch(
      (err) => console.warn("Failed to register upload task:", err.message),
    );
    Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK_NAME).catch(
      (err) => console.warn("Failed to register notification task:", err.message),
    );
    setupUploadNotificationChannel().catch((err) =>
      console.warn("Failed to set up upload notification channel:", err),
    );
  }, [hasCompletedIntro, isIntroStateLoading]);

  // Show loading state while checking authentication
  if (isLoading || isIntroStateLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#74becb" />
      </View>
    );
  }

  if (!hasCompletedIntro) {
    return <Redirect href={"/onboarding" as any} />;
  }

  // Redirect based on authentication status
  return ((isAuthenticated || isGuestMode) && !isLoading) || __DEV__ ? (
    <Redirect href="/map" />
  ) : (
    <Redirect href="/auth/login" />
  );
}
