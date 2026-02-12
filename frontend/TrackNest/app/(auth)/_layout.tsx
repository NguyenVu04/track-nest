import fetch from "cross-fetch"; // polyfill for RN
import { Stack } from "expo-router";

global.fetch = global.fetch || fetch;

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
