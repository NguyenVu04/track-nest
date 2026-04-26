import { tabs as tabsLang } from "@/constant/languages";
import { useRequireAuth } from "@/contexts/AuthContext";
import { useDevMode } from "@/contexts/DevModeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { colors, radii, spacing } from "@/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const TAB_BAR_HEIGHT = 70;

export default function RootLayout() {
  const t = useTranslation(tabsLang);
  const { devMode } = useDevMode();
  const insets = useSafeAreaInsets();
  const tabBarBottomPadding = Math.max(insets.bottom, spacing.sm);
  const tabBarHeight = TAB_BAR_HEIGHT + tabBarBottomPadding;

  const { isAuthenticated, isGuestMode } = useRequireAuth();
  const showDevTabs = devMode || __DEV__;

  if (!isAuthenticated && !isGuestMode && !__DEV__) return null;

  return (
    <Tabs
      initialRouteName="map"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: spacing.xs,
        },
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          backgroundColor: colors.bg,
          elevation: 12,
          shadowColor: colors.primaryDark,
          shadowOpacity: 0.15,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -3 },
          paddingBottom: tabBarBottomPadding,
        },
        tabBarItemStyle: {
          marginVertical: spacing.xs,
          borderRadius: radii.md,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: t.map,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "map" : "map-outline"}
              size={22}
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
              name={focused ? "list" : "list-outline"}
              size={22}
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
              size={22}
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
              size={22}
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
              size={22}
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
              size={22}
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
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="voice-test"
        options={{
          title: "Voice Test",
          href: showDevTabs ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "mic" : "mic-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
