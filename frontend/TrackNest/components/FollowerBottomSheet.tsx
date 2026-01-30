import { FollowerBottomSheet as followerBottomSheetLang } from "@/constant/languages";
import { Follower } from "@/constant/types";
import { useTranslation } from "@/hooks/useTranslation";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { Alert, Button } from "react-native";
import { FollowerInfo } from "./FollowerInfo";

export const FollowerBottomSheet = ({
  follower,
}: {
  follower: Follower | null;
}) => {
  const t = useTranslation(followerBottomSheetLang);

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
            color="#d97706"
            title={t.reportMissing}
            onPress={() => {
              Alert.alert(t.reportSubmitted, t.thankYou);
            }}
          />
        </>
      ) : null}
    </BottomSheetView>
  );
};
