import { colors } from "@/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AppHeaderProps {
  onFamilyPress?: () => void;
  onNotificationsPress?: () => void;
}

export default function AppHeader({ onFamilyPress }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable style={styles.iconBtn} onPress={onFamilyPress} hitSlop={8}>
        <Ionicons name="people" size={24} color={colors.primary} />
      </Pressable>

      <Text style={styles.title}>TrackNest</Text>

      <Pressable
        style={styles.iconBtn}
        onPress={() => router.push("/(app)/notifications" as any)}
        hitSlop={8}
      >
        <Ionicons name="notifications" size={24} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 6,
    backgroundColor: colors.primaryMuted,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.3,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
