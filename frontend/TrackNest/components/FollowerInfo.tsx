import { FollowerInfo as followerInfoLang } from "@/constant/languages";
import { Follower } from "@/constant/types";
import { useTranslation } from "@/hooks/useTranslation";
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

export const FollowerInfo = ({
  follower,
  width,
  height,
  standMode,
}: FollowerInfoProps) => {
  const t = useTranslation(followerInfoLang);
  const [address, setAddress] = useState<string>("");
  const [isGettingAddress, setIsGettingAddress] = useState<boolean>(false);

  const formatAddress = useCallback(async () => {
    setIsGettingAddress(true);
    try {
      const address = await formatAddressFromLatLng(
        follower.latitude,
        follower.longitude,
      );

      setAddress(address);
    } catch (error) {
      console.error("Error formatting address:", error);
    } finally {
      setIsGettingAddress(false);
    }
  }, [follower.latitude, follower.longitude]);

  const componentSize = {
    image: typeof width === "string" ? parseInt(width) : width || 100,
    addressText:
      standMode === "compact"
        ? typeof width === "string"
          ? parseInt(width)
          : width || 100
        : typeof width === "string"
          ? parseInt(width) * 2
          : (width || 100) * 2,
  };

  useEffect(() => {
    formatAddress();
  }, [formatAddress]);

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{follower.name}</Text>
      <View style={styles.imageContainer}>
        <Image
          source={require("@/assets/images/150-0.jpeg")}
          style={[
            styles.image,
            {
              width: componentSize.image,
              height: componentSize.image,
            },
          ]}
          resizeMode="cover"
        />
        <View
          style={[
            styles.activeStatusContainer,
            {
              backgroundColor: follower.sharingActive
                ? "transparent"
                : "#f0f0f0",
            },
          ]}
        >
          {follower.sharingActive ? (
            <View style={styles.activeStatusCircle} />
          ) : (
            <Text
              style={[
                styles.activeStatusText,
                {
                  color: "#999999",
                },
              ]}
            >
              {formatRelativeTime(follower?.lastActive)}
            </Text>
          )}
        </View>
      </View>
      <Text
        style={{
          maxWidth: componentSize.addressText,
          textAlign: "center",
        }}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {isGettingAddress
          ? t.loading
          : address?.length > 0
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
    borderRadius: "50%",
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#74becb",
  },
  activeStatusText: {
    fontSize: 14,
    textAlign: "center",
  },
});
