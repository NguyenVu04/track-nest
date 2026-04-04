import { login as loginLang } from "@/constant/languages";
import {
  getKeycloakDiscovery,
  StoredTokens,
  useAuth,
  clientId,
} from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";
import {
  exchangeCodeAsync,
  makeRedirectUri,
  ResponseType,
  useAuthRequest,
} from "expo-auth-session";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const t = useTranslation(loginLang);
  const { isAuthenticated, isLoading: isCheckingAuth, saveTokens } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [discovery, setDiscovery] = useState<{
    authorizationEndpoint: string;
    tokenEndpoint: string;
    revocationEndpoint: string;
  } | null>(null);

  const redirectUri = makeRedirectUri({ scheme: "tracknest" });

  // Initialize Keycloak discovery
  useEffect(() => {
    const initDiscovery = async () => {
      const discoveryResult = await getKeycloakDiscovery();
      setDiscovery(discoveryResult);
    };
    initDiscovery();
  }, []);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: clientId,
      scopes: ["openid", "profile", "email", "offline_access"],
      redirectUri: redirectUri,
      responseType: ResponseType.Code,
      usePKCE: true,
    },
    discovery,
  );

  // Redirect to map if already authenticated
  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated) {
      router.replace("/map");
    }
  }, [isCheckingAuth, isAuthenticated, router]);

  const exchangeToken = useCallback(
    async (code: string) => {
      setIsLoading(true);
      try {
        const discoveryConfig = await getKeycloakDiscovery();
        const tokenResult = await exchangeCodeAsync(
          {
            clientId: clientId,
            code: code,
            redirectUri: redirectUri,
            extraParams: {
              code_verifier: request?.codeVerifier || "",
            },
          },
          discoveryConfig,
        );

        console.log("Token exchange successful");

        // Calculate expiration time
        const expiresAt = Date.now() + (tokenResult.expiresIn ?? 300) * 1000;

        // Save tokens to context (and storage)
        const tokens: StoredTokens = {
          accessToken: tokenResult.accessToken,
          refreshToken: tokenResult.refreshToken ?? null,
          idToken: tokenResult.idToken ?? null,
          expiresAt,
        };

        await saveTokens(tokens);

        // Navigate to the map screen
        router.replace("/map");
      } catch (error) {
        console.error("Token exchange error:", error);
        Alert.alert(t.loginFailedTitle, t.loginFailedMessage, [
          { text: t.okButton },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [redirectUri, request?.codeVerifier, router, t, saveTokens],
  );

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      exchangeToken(code);
    } else if (response?.type === "error") {
      console.error("OAuth error:", response.error);
      Alert.alert(t.loginFailedTitle, t.loginFailedMessage, [
        { text: t.okButton },
      ]);
    }
  }, [response, exchangeToken, t]);

  const handleLogin = async () => {
    if (!request) {
      Alert.alert("Error", "Authentication not ready. Please try again.");
      return;
    }
    promptAsync();
  };

  // Show loading while checking existing auth
  if (isCheckingAuth) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#74becb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require("@/assets/images/android-icon-foreground.png")}
              style={{ width: 132, height: 132 }}
            />
          </View>
          <Text style={styles.appTitle}>{t.appTitle}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        <View style={styles.form}>
          <Pressable
            style={[
              styles.loginButton,
              (!request || isLoading) && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!request || isLoading}
            android_ripple={{ color: "#0052cc" }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="key-outline"
                  size={20}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.loginButtonText}>{t.loginButton}</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>TrackNest v1.0.0</Text>
          <Text style={styles.hintText}>Secure login with Keycloak</Text>
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
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
    overflow: "hidden",
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
  loginButton: {
    backgroundColor: "#74becb",
    borderRadius: 12,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: "#a8d4db",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonIcon: {
    marginRight: 8,
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
