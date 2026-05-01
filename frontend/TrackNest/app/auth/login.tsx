import { useAppModal } from "@/components/Modals/AppModal";
import { DeveloperOptionsModal } from "@/components/SettingsModals/DeveloperOptionsModal";
import { login as loginLang } from "@/constant/languages";
import {
  clientId,
  getKeycloakDiscovery,
  StoredTokens,
  useAuth,
} from "@/contexts/AuthContext";
import { useDevMode } from "@/contexts/DevModeContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CRIMINAL_URL_KEY,
  EMERGENCY_URL_KEY,
  getCriminalUrl,
  getEmergencyUrl,
  getServiceUrl,
  SERVICE_URL_KEY,
} from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  exchangeCodeAsync,
  makeRedirectUri,
  ResponseType,
  useAuthRequest,
} from "expo-auth-session";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
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
  const [emergencyUrl, setEmergencyUrl] = useState("");
  const [emergencyUrlInput, setEmergencyUrlInput] = useState("");
  const [criminalUrl, setCriminalUrl] = useState("");
  const [criminalUrlInput, setCriminalUrlInput] = useState("");
  const [pendingDevMode, setPendingDevMode] = useState(false);

  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<any>(null);

  useEffect(() => {
    Promise.all([getServiceUrl(), getEmergencyUrl(), getCriminalUrl()]).then(
      ([svcUrl, emUrl, crUrl]) => {
        setServerUrl(svcUrl);
        setServerUrlInput(svcUrl);
        setEmergencyUrl(emUrl);
        setEmergencyUrlInput(emUrl);
        setCriminalUrl(crUrl);
        setCriminalUrlInput(crUrl);
      },
    );
  }, []);

  useEffect(() => {
    getKeycloakDiscovery().then(setDiscovery);
  }, []);

  const redirectUri = makeRedirectUri({
    scheme: "tracknest",
    path: "auth/login",
  });

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

        /* console.log("Token exchange successful") */ // Calculate expiration time
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
        showAlert(
          t.loginFailedTitle,
          t.loginFailedMessage,
          "error",
          t.okButton,
        );
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

  const handleFooterTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      setServerUrlInput(serverUrl);
      setEmergencyUrlInput(emergencyUrl);
      setCriminalUrlInput(criminalUrl);
      setPendingDevMode(devMode);
      setShowDevModal(true);
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 500);
    }
  };

  const upsertServiceUrl = async (key: string, value: string) => {
    if (value) await AsyncStorage.setItem(key, value);
    else await AsyncStorage.removeItem(key);
  };

  const handleSaveDevOptions = async () => {
    const ts = serverUrlInput.trim();
    const te = emergencyUrlInput.trim();
    const tc = criminalUrlInput.trim();
    try {
      await Promise.all([
        upsertServiceUrl(SERVICE_URL_KEY, ts),
        upsertServiceUrl(EMERGENCY_URL_KEY, te),
        upsertServiceUrl(CRIMINAL_URL_KEY, tc),
      ]);
      setServerUrl(ts);
      setServerUrlInput(ts);
      setEmergencyUrl(te);
      setEmergencyUrlInput(te);
      setCriminalUrl(tc);
      setCriminalUrlInput(tc);
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

        <Pressable onPress={handleFooterTap} style={styles.footer}>
          <Text style={styles.footerText}>{t.footerVersion}</Text>
          <Text style={styles.hintText}>{t.footerHint}</Text>
        </Pressable>
      </View>

      {modal}

      <DeveloperOptionsModal
        visible={showDevModal}
        onClose={() => setShowDevModal(false)}
        serverUrlInput={serverUrlInput}
        onChangeServerUrlInput={setServerUrlInput}
        emergencyUrlInput={emergencyUrlInput}
        onChangeEmergencyUrlInput={setEmergencyUrlInput}
        criminalUrlInput={criminalUrlInput}
        onChangeCriminalUrlInput={setCriminalUrlInput}
        pendingDevMode={pendingDevMode}
        onChangePendingDevMode={setPendingDevMode}
        onSave={handleSaveDevOptions}
        t={t as any}
      />
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
});
