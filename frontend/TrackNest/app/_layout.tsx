import { AuthProvider } from "@/contexts/AuthContext";
import { DevModeProvider } from "@/contexts/DevModeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MapProvider } from "@/contexts/MapContext";
import { TrackingProvider } from "@/contexts/TrackingContext";
import { useCrashDetection } from "@/hooks/useCrashDetection";
import "@/services/backgroundTasks";
import fetch from "cross-fetch"; // polyfill for RN
import { Stack } from "expo-router";

global.fetch = global.fetch || fetch;

export default function RootLayout() {
  useCrashDetection();
  return (
    <AuthProvider>
      <DevModeProvider>
        <LanguageProvider>
          <TrackingProvider>
            <MapProvider>
              <Stack screenOptions={{ headerShown: false }}></Stack>
            </MapProvider>
          </TrackingProvider>
        </LanguageProvider>
      </DevModeProvider>
    </AuthProvider>
  );
}
