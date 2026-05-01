import { colors, shadows } from "@/styles/styles";
import { useRouter } from "expo-router";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

type SosFabProps = {
  style?: StyleProp<ViewStyle>;
};

export default function SosFab({ style }: SosFabProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/sos")}
      style={[styles.button, style]}
    >
      <Text style={styles.iconStar}>✳</Text>
      <Text style={styles.label}>SOS</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 55,
    height: 55,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },
  label: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  iconStar: {
    fontSize: 28,
    fontWeight: 900,
    color: "#fff",
  },
});
