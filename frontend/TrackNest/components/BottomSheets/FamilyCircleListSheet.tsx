import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";

import { FamilyCircleBottomSheet } from "../FamilyCircleBottomSheet";

type FamilyCircleProps = {
  familyCircleSheetRef: React.RefObject<BottomSheetModal | null>;
  renderBackdrop: (props: any) => React.ReactElement;
  selectedCircle: any;
  handleSelectFamilyCircle: (circle: any) => void;
  handleAddFamilyCircle: () => void;
};

const FamilyCircleListSheet = ({
  familyCircleSheetRef,
  renderBackdrop,
  selectedCircle,
  handleSelectFamilyCircle,
  handleAddFamilyCircle,
}: FamilyCircleProps) => {
  const handleSheetChanges = (index: number) => {};

  return (
    <BottomSheetModal
      ref={familyCircleSheetRef}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={false}
      snapPoints={["55%"]}
      index={0}
      enableContentPanningGesture={false}
    >
      <FamilyCircleBottomSheet
        selectedCircleId={selectedCircle?.familyCircleId ?? null}
        onSelectCircle={handleSelectFamilyCircle}
        onAddFamilyCircle={handleAddFamilyCircle}
      />
    </BottomSheetModal>
  );
};

export default FamilyCircleListSheet;
