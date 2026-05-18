import { useNotificationContext } from "@/contexts/NotificationContext";
import { colors } from "@/styles/styles";
import { fontScale, moderateScale } from "@/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, XStack } from "tamagui";

interface AppHeaderProps {
  onFamilyPress?: () => void;
}

export default function AppHeader({ onFamilyPress }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { unreadCount } = useNotificationContext();

  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal={20}
      paddingBottom={6}
      paddingTop={insets.top}
      backgroundColor={colors.primaryMuted}
    >
      <Button
        onPress={onFamilyPress}
        width={40}
        height={40}
        borderRadius={20}
        backgroundColor="transparent"
        alignItems="center"
        justifyContent="center"
        pressStyle={{ opacity: 0.7 }}
        padding={0}
        hitSlop={8}
      >
        <Ionicons name="people" size={24} color={colors.primary} />
      </Button>

      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.primary, letterSpacing: 0.3 }}>
        TrackNest
      </Text>

      <Button
        onPress={() => router.push("/(app)/notifications" as any)}
        width={40}
        height={40}
        borderRadius={20}
        backgroundColor="transparent"
        alignItems="center"
        justifyContent="center"
        pressStyle={{ opacity: 0.7 }}
        padding={0}
        hitSlop={8}
      >
        <View>
          <Ionicons name="notifications" size={24} color={colors.primary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : String(unreadCount)}
              </Text>
            </View>
          )}
        </View>
      </Button>
    </XStack>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: fontScale(9),
    fontWeight: "700",
    lineHeight: moderateScale(14),
  },
});
