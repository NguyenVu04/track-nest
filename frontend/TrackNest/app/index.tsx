import {
  BACKGROUND_USER_LOCATION_TASK_NAME,
  LOCATION_STORAGE_KEY,
} from "@/constant";
import { LocationState } from "@/constant/types";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserLocation } from "@/services/tracker";
import { saveKey } from "@/utils";
import * as Location from "expo-location";
import { Redirect } from "expo-router";
import * as TaskManager from "expo-task-manager";
import { ActivityIndicator, View } from "react-native";

TaskManager.defineTask(
  BACKGROUND_USER_LOCATION_TASK_NAME,
  async ({ data, error }) => {
    if (error) {
      // check `error.message` for more details.
      return;
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
        const response = await updateUserLocation(lat, lng, acc || 0, vel || 0);

        console.log(JSON.stringify(response, null, 2));
      } catch (error: any) {
        console.error("Error updating location in background:", error.message);
      } finally {
        console.log("Location updated in background.");
      }
    }
  },
);

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
