import { BACKGROUND_LOCATION_UPLOAD_TASK_NAME } from "@/constant";
import { useAuth } from "@/contexts/AuthContext";
import { registerBackgroundTaskAsync } from "@/utils";
import { setupUploadNotificationChannel } from "@/utils/notifications";
import * as Location from "expo-location";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isAuthenticated, isGuestMode, isLoading } = useAuth();

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
    requestBackgroundLocationPermission();
    // Register the background upload task so expo-background-task can invoke it
    // periodically while the app is backgrounded.
    registerBackgroundTaskAsync(BACKGROUND_LOCATION_UPLOAD_TASK_NAME).catch(
      (err) => console.warn("Failed to register upload task:", err.message),
    );
    setupUploadNotificationChannel().catch((err) =>
      console.warn("Failed to set up upload notification channel:", err),
    );
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#74becb" />
      </View>
    );
  }

  // Redirect based on authentication status
  return ((isAuthenticated || isGuestMode) && !isLoading) || __DEV__ ? (
    <Redirect href="/map" />
  ) : (
    <Redirect href="/auth/login" />
  );
}
