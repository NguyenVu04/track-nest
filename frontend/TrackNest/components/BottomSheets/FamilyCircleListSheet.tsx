import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import { useWindowDimensions } from "react-native";

import { FamilyCircle } from "@/constant/types";
import { FamilyCircleBottomSheet } from "../FamilyCircleBottomSheet";

type FamilyCircleProps = {
  familyCircleSheetRef: React.RefObject<BottomSheetModal | null>;
  renderBackdrop: (props: any) => React.ReactElement;
  selectedCircle: FamilyCircle | null;
  handleSelectFamilyCircle: (circle: FamilyCircle) => void;
  familyCircles: FamilyCircle[];
  onRefresh?: () => Promise<void>;
};

const FamilyCircleListSheet = ({
  familyCircleSheetRef,
  renderBackdrop,
  selectedCircle,
  handleSelectFamilyCircle,
  familyCircles,
  onRefresh,
}: FamilyCircleProps) => {
  const { height: screenHeight } = useWindowDimensions();
  const handleSheetChanges = (index: number) => {};

  return (
    <BottomSheetModal
      ref={familyCircleSheetRef}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={true}
      maxDynamicContentSize={Math.floor(screenHeight * 0.8)}
      index={0}
      enableContentPanningGesture={true}
    >
      <FamilyCircleBottomSheet
        selectedCircleId={selectedCircle?.familyCircleId ?? null}
        onSelectCircle={handleSelectFamilyCircle}
        familyCircles={familyCircles}
        onRefresh={onRefresh}
      />
    </BottomSheetModal>
  );
};

export default FamilyCircleListSheet;
