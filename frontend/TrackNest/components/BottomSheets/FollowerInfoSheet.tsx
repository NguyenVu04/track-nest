import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import { FollowerBottomSheet } from "../FollowerBottomSheet";

type FollowerInfoSheetProps = {
  followerInfoSheetRef: React.RefObject<BottomSheetModal | null>;
  renderBackdrop: (props: any) => React.ReactElement;
  selectedFollower: any;
  tabBarHeight?: number;
  speedKmh: number | null;
  address: string | null;
  onChatPress: () => void;
  onCallPress: () => void;
};

const FollowerInfoSheet = ({
  followerInfoSheetRef,
  renderBackdrop,
  selectedFollower,
  tabBarHeight = 0,
  speedKmh,
  address,
  onChatPress,
  onCallPress,
}: FollowerInfoSheetProps) => {
  const handleSheetChanges = (index: number) => {};

  return (
    <BottomSheetModal
      ref={followerInfoSheetRef ?? undefined}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      bottomInset={tabBarHeight}
      containerStyle={{ bottom: tabBarHeight }}
    >
      <FollowerBottomSheet
        follower={selectedFollower}
        speedKmh={speedKmh}
        address={address}
        onChatPress={onChatPress}
        onCallPress={onCallPress}
      />
    </BottomSheetModal>
  );
};

export default FollowerInfoSheet;
