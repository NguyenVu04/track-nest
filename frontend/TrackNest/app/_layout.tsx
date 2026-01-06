import { LanguageProvider } from "@/contexts/LanguageContext";
import fetch from "cross-fetch"; // polyfill for RN
import { Stack } from "expo-router";

global.fetch = global.fetch || fetch;

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="manage-trackers" />
        <Stack.Screen name="missing-detail" />
        <Stack.Screen name="report-detail" />
      </Stack>
    </LanguageProvider>
  );
}
