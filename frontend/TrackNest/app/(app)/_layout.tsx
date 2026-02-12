import fetch from "cross-fetch"; // polyfill for RN
import { Stack } from "expo-router";

global.fetch = global.fetch || fetch;

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="family-circles/new" />
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
  );
}
