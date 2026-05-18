import AppHeader from "@/components/AppHeader";
import {
  CHAT_BADGE_CHANGED_EVENT,
  CHAT_UNREAD_KEY,
  OPEN_GENERAL_INFO_SHEET_EVENT,
} from "@/constant";
import { tabs as tabsLang } from "@/constant/languages";
import { useRequireAuth } from "@/contexts/AuthContext";
import { useDevMode } from "@/contexts/DevModeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { colors, spacing } from "@/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, useRouter, useSegments } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { DeviceEventEmitter, InteractionManager } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 70;
const APP_HEADER_CONTENT_HEIGHT = 46;

export default function RootLayout() {
  const t = useTranslation(tabsLang);
  const { devMode } = useDevMode();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const appHeaderHeight = insets.top + APP_HEADER_CONTENT_HEIGHT;
  const tabBarBottomPadding = Math.max(insets.bottom, spacing.xs);
  const tabBarHeight = TAB_BAR_HEIGHT + tabBarBottomPadding;

  const { isAuthenticated, isGuestMode } = useRequireAuth();
  const showDevTabs = devMode;
  const [chatBadge, setChatBadge] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(CHAT_UNREAD_KEY)
      .then((val) => setChatBadge(parseInt(val ?? "0", 10) || 0))
      .catch(() => {});

    const sub = DeviceEventEmitter.addListener(
      CHAT_BADGE_CHANGED_EVENT,
      (count: number) => setChatBadge(count),
    );
    return () => sub.remove();
  }, []);

  const familyPressLockRef = useRef(false);

  const handleFamilyPress = useCallback(() => {
    if (familyPressLockRef.current) return;
    familyPressLockRef.current = true;
    setTimeout(() => {
      familyPressLockRef.current = false;
    }, 600);

    const emitOpenSheet = () => {
      DeviceEventEmitter.emit(OPEN_GENERAL_INFO_SHEET_EVENT);
    };

    const activeRoute = segments[segments.length - 1];
    if (activeRoute === "map") {
      emitOpenSheet();
      return;
    }

    router.push("/(app)/(tabs)/map");
    InteractionManager.runAfterInteractions(emitOpenSheet);
  }, [router, segments]);

  if (!isAuthenticated && !isGuestMode && !__DEV__) return null;

  return (
    <Tabs
      initialRouteName="map"
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader onFamilyPress={handleFamilyPress} />,
        headerStyle: {
          height: appHeaderHeight,
          backgroundColor: "transparent",
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarAllowFontScaling: true,
        tabBarStyle: {
          minHeight: tabBarHeight,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          backgroundColor: colors.surfaceLight,
          elevation: 12,
          shadowOpacity: 0.1,
          paddingBottom: tabBarBottomPadding,
          shadowOffset: { width: 0, height: -5 },
        },
        tabBarItemStyle: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          width: "auto",
          borderRadius: 16,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: t.map,
          // Keep MapView alive across tab switches so tiles don't reload.
          // unmountOnBlur is a valid React Navigation option passed through
          // by Expo Router at runtime; cast needed as types don't expose it.
          ...({ unmountOnBlur: false } as object),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "map" : "map-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="family-chat"
        options={{
          title: t.familyChat,
          tabBarBadge: chatBadge > 0 ? chatBadge : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={32}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t.reports,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "bar-chart" : "bar-chart-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t.dashboard,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.settings,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="tracker-test"
        options={{
          title: t.trackerTest,
          href: showDevTabs ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tracking-manager-test"
        options={{
          title: t.trackingManagerTest,
          href: showDevTabs ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifier-test"
        options={{
          title: t.notifierTest,
          href: showDevTabs ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notification-test"
        options={{
          title: t.pushTest,
          href: showDevTabs ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused
                  ? "notifications-circle"
                  : "notifications-circle-outline"
              }
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="voice-test"
        options={{
          title: t.voiceTest,
          href: showDevTabs ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "mic" : "mic-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="test-notifications"
        options={{
          title: t.testNotifications,
          href: showDevTabs ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "flask" : "flask-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
