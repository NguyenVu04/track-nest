import { Follower } from "@/constant/types";
import { formatRelativeTime } from "@/utils";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { Alert, Button, Image, Text } from "react-native";

export const FollowerBottomSheet = ({
  follower,
}: {
  follower: Follower | null;
}) => {
  if (!follower) {
    console.warn("FollowerBottomSheet rendered without follower");
    return null;
  }

  return (
    <BottomSheetView
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 24,
        gap: 12,
      }}
    >
      {follower ? (
        <>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            {follower.name}
          </Text>
          <Image
            source={require("@/assets/images/150-0.jpeg")}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 3,
              borderColor: follower.sharingActive ? "#2b9fff" : "#ccc",
            }}
            resizeMode="cover"
          />
          <Text>
            Last Active:{" "}
            {follower.sharingActive
              ? "now"
              : formatRelativeTime(follower?.lastActive)}
          </Text>
          <Button
            title="Report missing"
            onPress={() => {
              Alert.alert("Report submitted", "Thank you for your report.");
            }}
          />
        </>
      ) : null}
    </BottomSheetView>
  );
};
