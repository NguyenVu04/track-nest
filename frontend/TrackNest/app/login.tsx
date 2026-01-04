import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const CREDENTIALS_KEY = "@TrackNest:credentials";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (username.trim() === "admin" && password === "admin") {
      if (saveCredentials) {
        try {
          await AsyncStorage.setItem(
            CREDENTIALS_KEY,
            JSON.stringify({ username, password })
          );
        } catch (error) {
          console.error("Failed to save credentials:", error);
        }
      } else {
        // Clear saved credentials if user unchecked the box
        await AsyncStorage.removeItem(CREDENTIALS_KEY);
      }
      // Navigate to the map screen
      router.replace("/(tabs)/map");
    } else {
      Alert.alert(
        "Login Failed",
        "Invalid credentials. Use admin/admin to login.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="navigate" size={48} color="#0b62ff" />
          </View>
          <Text style={styles.appTitle}>TrackNest</Text>
          <Text style={styles.subtitle}>Track your world with ease</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#6b7280"
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={styles.checkboxRow}
            onPress={() => setSaveCredentials(!saveCredentials)}
          >
            <View
              style={[
                styles.checkbox,
                saveCredentials && styles.checkboxChecked,
              ]}
            >
              {saveCredentials && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              Save credentials on this device
            </Text>
          </Pressable>

          <Pressable
            style={styles.loginButton}
            onPress={handleLogin}
            android_ripple={{ color: "#0052cc" }}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Safety Tracker App v1.0.0</Text>
          <Text style={styles.hintText}>Hint: Use admin/admin to login</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#0b62ff",
    borderColor: "#0b62ff",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#4b5563",
  },
  loginButton: {
    backgroundColor: "#0b62ff",
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    marginTop: 48,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  hintText: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
});
