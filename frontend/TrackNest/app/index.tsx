import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

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
  return isAuthenticated ? (
    <Redirect href="/(tabs)/map" />
  ) : (
    <Redirect href="/login" />
  );
}
