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
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
          </MapProvider>
        </TrackingProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
