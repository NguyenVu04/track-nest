import { FollowerInfo as followerInfoLang } from "@/constant/languages";
import { Follower } from "@/constant/types";
import { useTranslation } from "@/hooks/useTranslation";
import { colors } from "@/styles/styles";
import { formatAddressFromLatLng, formatRelativeTime } from "@/utils";
import { useState, useEffect, useCallback } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface FollowerInfoProps {
  follower: Follower;
  standMode: "compact" | "detailed";
  width?: number | string;
  height?: number | string;
  onPress?: () => void;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export const FollowerInfo = ({
  follower,
  width,
  standMode,
}: FollowerInfoProps) => {
  const t = useTranslation(followerInfoLang);
  const [address, setAddress] = useState<string>("");
  const [isGettingAddress, setIsGettingAddress] = useState<boolean>(false);

  const formatAddress = useCallback(async () => {
    setIsGettingAddress(true);
    try {
      const resolved = await formatAddressFromLatLng(
        follower.latitude,
        follower.longitude,
      );
      setAddress(resolved);
    } catch {
      // address stays empty — handled by the no-address fallback below
    } finally {
      setIsGettingAddress(false);
    }
  }, [follower.latitude, follower.longitude]);

  useEffect(() => {
    formatAddress();
  }, [formatAddress]);

  const imageSize = typeof width === "string" ? parseInt(width) : width ?? 100;
  const addressWidth =
    standMode === "compact" ? imageSize : imageSize * 2;

  const initials = getInitials(follower.name);
  const avatarBg = follower.sharingActive ? colors.primary : "#999";

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{follower.name}</Text>

      <View style={styles.imageContainer}>
        {follower.avatar ? (
          <Image
            source={{ uri: follower.avatar }}
            style={[styles.image, { width: imageSize, height: imageSize }]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.initialsCircle,
              { width: imageSize, height: imageSize, borderRadius: imageSize / 2, backgroundColor: avatarBg },
            ]}
          >
            <Text style={[styles.initialsText, { fontSize: imageSize * 0.32 }]}>
              {initials}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.activeStatusContainer,
            { backgroundColor: follower.sharingActive ? "transparent" : "#f0f0f0" },
          ]}
        >
          {follower.sharingActive ? (
            <View style={styles.activeStatusCircle} />
          ) : (
            <Text style={styles.activeStatusText}>
              {formatRelativeTime(follower?.lastActive)}
            </Text>
          )}
        </View>
      </View>

      <Text
        style={{ maxWidth: addressWidth, textAlign: "center" }}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {isGettingAddress
          ? t.loading
          : address.length > 0
            ? address
            : t.noAddressAvailable}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    borderRadius: 50,
  },
  initialsCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    color: "#fff",
    fontWeight: "700",
  },
  activeStatusContainer: {
    position: "absolute",
    padding: 4,
    borderRadius: 8,
    marginTop: 8,
    bottom: 0,
    right: 0,
  },
  activeStatusCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#74becb",
  },
  activeStatusText: {
    fontSize: 14,
    textAlign: "center",
    color: "#999999",
  },
});
