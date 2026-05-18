import { colors } from "@/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text, XStack } from "tamagui";

interface AppHeaderProps {
  onFamilyPress?: () => void;
  onNotificationsPress?: () => void;
}

export default function AppHeader({ onFamilyPress }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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

      <Text fontSize={18} fontWeight="700" color={colors.primary} letterSpacing={0.3}>
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
        <Ionicons name="notifications" size={24} color={colors.primary} />
      </Button>
    </XStack>
  );
}
