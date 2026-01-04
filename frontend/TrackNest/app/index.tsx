import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

const CREDENTIALS_KEY = "@TrackNest:credentials";

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const savedCredentials = await AsyncStorage.getItem(CREDENTIALS_KEY);
      if (savedCredentials) {
        const { username, password } = JSON.parse(savedCredentials);
        // Verify saved credentials are still valid
        if (username === "admin" && password === "admin") {
          setIsAuthenticated(true);
          return;
        }
      }
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Failed to check authentication:", error);
      setIsAuthenticated(false);
    }
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0b62ff" />
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
