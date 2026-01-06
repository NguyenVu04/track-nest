import { Follower } from "@/constant/types";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { Alert, Button } from "react-native";
import { FollowerInfo } from "./FollowerInfo";

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
          <FollowerInfo
            follower={follower}
            width={100}
            height={100}
            standMode="detailed"
          />
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
