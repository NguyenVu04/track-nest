import fetch from "cross-fetch"; // polyfill for RN
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

global.fetch = global.fetch || fetch;

export default function AuthLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
      </Stack>
    </SafeAreaView>
  );
}
