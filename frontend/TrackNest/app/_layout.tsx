import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#0b62ff",
        tabBarIcon: ({ color, size }) => {
          const name = route.name;
          if (name.includes("map"))
            return <Ionicons name="map" size={size} color={color} />;
          if (name.includes("reports"))
            return <Ionicons name="list" size={size} color={color} />;
          if (name.includes("settings"))
            return <Ionicons name="settings" size={size} color={color} />;
          return <Ionicons name="ellipse" size={size} color={color} />;
        },
      })}
    />
  );
}
