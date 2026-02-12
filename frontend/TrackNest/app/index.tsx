import {
  BACKGROUND_CIRCLE_LOCATION_TASK_NAME,
  BACKGROUND_USER_LOCATION_TASK_NAME,
  LOCATION_STORAGE_KEY,
  LOCATION_UPDATE_EMIT_EVENT,
} from "@/constant";
import { LocationState } from "@/constant/types";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserLocation } from "@/services/tracker";
import { saveKey } from "@/utils";
import * as BackgroundTask from "expo-background-task";
import * as Location from "expo-location";
import { Redirect } from "expo-router";
import * as TaskManager from "expo-task-manager";
import { ActivityIndicator, DeviceEventEmitter, View } from "react-native";

// Background location task definition
TaskManager.defineTask(
  BACKGROUND_USER_LOCATION_TASK_NAME,
  async ({ data, error }) => {
    if (error) {
      // check `error.message` for more details.

      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    const locations = (data as { locations?: Location.LocationObject[] })
      ?.locations;
    console.log("Received new locations", locations, locations?.length);
    if (locations && locations.length > 0 && locations[0]?.timestamp) {
      console.log(
        "Timestamp:",
        new Date(locations[0].timestamp).toLocaleString(),
      );
    }

    if (locations && locations.length > 0) {
      const {
        latitude: lat,
        longitude: lng,
        accuracy: acc,
        speed: vel,
      } = locations[0].coords;

      try {
        await saveKey<LocationState>(LOCATION_STORAGE_KEY, {
          latitude: lat,
          longitude: lng,
          speed: vel,
        });
        DeviceEventEmitter.emit(LOCATION_UPDATE_EMIT_EVENT, {
          latitude: lat,
          longitude: lng,
          speed: vel,
        });
        const response = await updateUserLocation(lat, lng, acc || 0, vel || 0);

        console.log(JSON.stringify(response, null, 2));

        return BackgroundTask.BackgroundTaskResult.Success;
      } catch (error: any) {
        console.error("Error updating location in background:", error.message);
        return BackgroundTask.BackgroundTaskResult.Failed;
      } finally {
        console.log("Location updated in background.");
      }
    }
  },
);

// Background circle location task definition
TaskManager.defineTask(BACKGROUND_CIRCLE_LOCATION_TASK_NAME, async () => {
  try {
    const now = Date.now();
    console.log(
      `Got background task call at date: ${new Date(now).toISOString()}`,
    );
  } catch (error) {
    console.error("Failed to execute the background task:", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
  return BackgroundTask.BackgroundTaskResult.Success;
});

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#74becb" />
      </View>
    );
  }

  // Redirect based on authentication status
  return isAuthenticated || __DEV__ ? (
    <Redirect href="/(tabs)/map" />
  ) : (
    <Redirect href="/login" />
  );
}
