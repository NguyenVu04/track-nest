import { login as loginLang } from "@/constant/languages";
import {
  clientId,
  getKeycloakDiscovery,
  StoredTokens,
  useAuth,
} from "@/contexts/AuthContext";
import { useDevMode } from "@/contexts/DevModeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { getServiceUrl, SERVICE_URL_KEY } from "@/utils";
import { useAppModal } from "@/components/Modals/AppModal";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const t = useTranslation(loginLang);
  const {
    isAuthenticated,
    isLoading: isCheckingAuth,
    saveTokens,
    continueAsGuest,
  } = useAuth();
  const { modal, showAlert } = useAppModal();

  const [isLoading, setIsLoading] = useState(false);
  const [discovery, setDiscovery] = useState<Awaited<
    ReturnType<typeof getKeycloakDiscovery>
  > | null>(null);
  const { devMode, setDevMode } = useDevMode();
  const [showDevModal, setShowDevModal] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [serverUrlInput, setServerUrlInput] = useState("");
  const [pendingDevMode, setPendingDevMode] = useState(false);

  useEffect(() => {
    getServiceUrl().then((url) => {
      setServerUrl(url);
    });
  }, []);

  useEffect(() => {
    getKeycloakDiscovery().then(setDiscovery);
  }, []);

  const redirectUri = makeRedirectUri({
    scheme: "tracknest",
    path: "auth/login",
  });

  console.log("Redirect URI:", redirectUri);

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
        const tokenResult = await exchangeCodeAsync(
          {
            clientId: clientId,
            code: code,
            redirectUri: redirectUri,
            extraParams: {
              code_verifier: request?.codeVerifier || "",
            },
          },
          await getKeycloakDiscovery(),
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
        showAlert(t.loginFailedTitle, t.loginFailedMessage, "error", t.okButton);
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
      showAlert(t.loginFailedTitle, t.loginFailedMessage, "error", t.okButton);
    }
  }, [response, exchangeToken, t]);

  const handleLogin = async () => {
    if (!request) {
      showAlert(t.errorTitle, t.authNotReadyMessage, "warning");
      return;
    }
    promptAsync();
  };

  const handleContinueWithoutLogin = async () => {
    try {
      await continueAsGuest();
      router.replace("/map");
    } catch (error) {
      console.error("Failed to continue as guest:", error);
      showAlert(t.errorTitle, t.guestModeErrorMessage, "error");
    }
  };

  const handleOpenDevModal = () => {
    setServerUrlInput(serverUrl);
    setPendingDevMode(devMode);
    setShowDevModal(true);
  };

  const handleSaveDevOptions = async () => {
    const trimmed = serverUrlInput.trim();
    try {
      if (trimmed) {
        await AsyncStorage.setItem(SERVICE_URL_KEY, trimmed);
      } else {
        await AsyncStorage.removeItem(SERVICE_URL_KEY);
      }
      setServerUrl(trimmed || (process.env.EXPO_PUBLIC_SERVICE_URL ?? ""));
      await setDevMode(pendingDevMode);
      setShowDevModal(false);
      showAlert(t.saveSuccessTitle, t.saveSuccessMessage, "success");
    } catch (e: any) {
      showAlert(t.errorTitle, e?.message ?? t.saveError, "error");
    }
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

          <Pressable
            style={styles.guestButton}
            onPress={handleContinueWithoutLogin}
            disabled={isLoading}
          >
            <Ionicons
              name="walk-outline"
              size={20}
              color="#4b5563"
              style={styles.buttonIcon}
            />
            <Text style={styles.guestButtonText}>{t.continueWithoutLogin}</Text>
          </Pressable>

          <Text style={styles.guestHint}>{t.continueWithoutLoginHint}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t.footerVersion}</Text>
          <Text style={styles.hintText}>{t.footerHint}</Text>
          <Pressable
            style={styles.devButton}
            onPress={handleOpenDevModal}
            hitSlop={8}
          >
            <Ionicons name="settings-outline" size={14} color="#9ca3af" />
            <Text style={styles.devButtonText}>{t.developerOptionsTitle}</Text>
          </Pressable>
        </View>
      </View>

      {modal}

      <Modal
        visible={showDevModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDevModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDevModal(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.developerOptionsTitle}</Text>
              <Pressable onPress={() => setShowDevModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
              <Text style={styles.devSectionLabel}>{t.serverUrlLabel}</Text>
              <Text style={{ color: "#666", marginBottom: 8, fontSize: 13 }}>
                {t.serverUrlDescription}
              </Text>
              <TextInput
                style={styles.urlInput}
                value={serverUrlInput}
                onChangeText={setServerUrlInput}
                placeholder={
                  process.env.EXPO_PUBLIC_SERVICE_URL ?? t.serverUrlPlaceholder
                }
                placeholderTextColor="#aaa"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              <View style={styles.devDivider} />

              <Text style={styles.devSectionLabel}>{t.devModeLabel}</Text>
              <View style={styles.devModeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.devModeRowTitle}>
                    {pendingDevMode ? t.enabled : t.disabled}
                  </Text>
                  <Text style={{ color: "#666", fontSize: 12, marginTop: 2 }}>
                    {t.devModeDescription}
                  </Text>
                </View>
                <Switch
                  value={pendingDevMode}
                  onValueChange={setPendingDevMode}
                  trackColor={{ false: "#d1d5db", true: "#74becb" }}
                  thumbColor="#fff"
                />
              </View>

              <Pressable
                style={[styles.saveButton, { marginTop: 20 }]}
                onPress={handleSaveDevOptions}
                android_ripple={{ color: "#5da8b5" }}
              >
                <Text style={styles.saveButtonText}>{t.saveButton}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
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
  guestButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  guestButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "700",
  },
  guestHint: {
    marginTop: -8,
    color: "#6b7280",
    fontSize: 12,
    textAlign: "center",
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
  devButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    padding: 4,
  },
  devButtonText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  devSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  devDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },
  devModeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  devModeRowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  urlInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#f9fafb",
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: "#74becb",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
