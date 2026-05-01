import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React, { useMemo } from "react";
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
  onAddFamilyCircle?: () => void;
  tabBarHeight?: number;
};

const FamilyCircleListSheet = ({
  familyCircleSheetRef,
  renderBackdrop,
  selectedCircle,
  handleSelectFamilyCircle,
  familyCircles,
  onRefresh,
  onAddFamilyCircle,
  tabBarHeight = 0,
}: FamilyCircleProps) => {
  const { height: screenHeight } = useWindowDimensions();
  const handleSheetChanges = (index: number) => {};
  // const snapPoints = useMemo(() => ["50%"], []);

  return (
    <BottomSheetModal
      ref={familyCircleSheetRef}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      // snapPoints={snapPoints}
      enableDynamicSizing
      maxDynamicContentSize={screenHeight * 0.6}
      index={0}
      enableContentPanningGesture={false}
      bottomInset={tabBarHeight}
      containerStyle={{ bottom: tabBarHeight }}
    >
      <FamilyCircleBottomSheet
        selectedCircleId={selectedCircle?.familyCircleId ?? null}
        onSelectCircle={handleSelectFamilyCircle}
        familyCircles={familyCircles}
        onRefresh={onRefresh}
        onAddFamilyCircle={onAddFamilyCircle}
        tabBarHeight={tabBarHeight}
      />
    </BottomSheetModal>
  );
};

export default FamilyCircleListSheet;
