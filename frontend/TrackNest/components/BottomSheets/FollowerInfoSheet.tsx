import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import { FollowerBottomSheet } from "../FollowerBottomSheet";

type FollowerInfoSheetProps = {
  followerInfoSheetRef: React.RefObject<BottomSheetModal | null>;
  renderBackdrop: (props: any) => React.ReactElement;
  selectedFollower: any;
};

const FollowerInfoSheet = ({
  followerInfoSheetRef,
  renderBackdrop,
  selectedFollower,
}: FollowerInfoSheetProps) => {
  const handleSheetChanges = (index: number) => {};

  return (
    <BottomSheetModal
      ref={followerInfoSheetRef ?? undefined}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
    >
      <FollowerBottomSheet follower={selectedFollower} />
    </BottomSheetModal>
  );
};

export default FollowerInfoSheet;
