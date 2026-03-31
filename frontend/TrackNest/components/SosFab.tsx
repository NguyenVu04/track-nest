import { colors, shadows } from "@/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

type SosFabProps = {
  style?: StyleProp<ViewStyle>;
};

export default function SosFab({ style }: SosFabProps) {
  const router = useRouter();

  const handlePress = () => {
    // Navigate to SOS screen on tap
    router.push("/sos");
  };

  return (
    <View style={[styles.container, style]}>
      <Pressable onPress={handlePress} style={styles.button}>
        {/* Icon */}
        <Ionicons
          name="alert-circle"
          size={28}
          color="#fff"
          style={styles.icon}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 16,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...shadows.medium,
  },
  icon: {
    zIndex: 1,
  },
});
