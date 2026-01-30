import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MapProvider } from "@/contexts/MapContext";
import { TrackingProvider } from "@/contexts/TrackingContext";
import fetch from "cross-fetch"; // polyfill for RN
import { Stack } from "expo-router";

global.fetch = global.fetch || fetch;

export default function RootLayout() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <TrackingProvider>
          <MapProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="manage-trackers" />
              <Stack.Screen name="missing-detail" />
              <Stack.Screen name="report-detail" />
              <Stack.Screen
                name="sos"
                options={{
                  gestureEnabled: false,
                  animation: "none",
                  headerBackVisible: false,
                }}
              />
            </Stack>
          </MapProvider>
        </TrackingProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
