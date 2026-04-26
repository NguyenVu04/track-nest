import { AuthProvider } from "@/contexts/AuthContext";
import { DevModeProvider } from "@/contexts/DevModeContext";
import { EmergencyProvider } from "@/contexts/EmergencyContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MapProvider } from "@/contexts/MapContext";
import { POIAnalyticsProvider } from "@/contexts/POIAnalyticsContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ReportsProvider } from "@/contexts/ReportsContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { TrackingProvider } from "@/contexts/TrackingContext";
import { useDistractionTracker } from "@/hooks/useDistractionTracker";
import { useDrivingMode } from "@/hooks/useDrivingMode";
import "@/services/backgroundTasks";
import fetch from "cross-fetch"; // polyfill for RN
import { Stack } from "expo-router";

global.fetch = global.fetch || fetch;

export default function RootLayout() {
  const drivingMode = useDrivingMode();
  useDistractionTracker(drivingMode);
  return (
    <AuthProvider>
      <DevModeProvider>
        <LanguageProvider>
          <ProfileProvider>
            <SettingsProvider>
              <TrackingProvider>
                <EmergencyProvider>
                  <ReportsProvider>
                    <POIAnalyticsProvider>
                      <MapProvider>
                        <Stack screenOptions={{ headerShown: false }}></Stack>
                      </MapProvider>
                    </POIAnalyticsProvider>
                  </ReportsProvider>
                </EmergencyProvider>
              </TrackingProvider>
            </SettingsProvider>
          </ProfileProvider>
        </LanguageProvider>
      </DevModeProvider>
    </AuthProvider>
  );
}
