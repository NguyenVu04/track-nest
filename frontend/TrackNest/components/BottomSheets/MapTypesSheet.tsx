import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import { MapType } from "react-native-maps";

import { MapTypeBottomSheet } from "../MapTypeBottomSheet";

type MapTypesSheetProps = {
  mapTypeSheetRef: React.RefObject<BottomSheetModal | null>;
  renderBackdrop: (props: any) => React.ReactElement;
  mapType: MapType;
  handleSelectMapType: (type: MapType) => void;
  tabBarHeight?: number;
};

const MapTypesSheet = ({
  mapTypeSheetRef,
  renderBackdrop,
  mapType,
  handleSelectMapType,
  tabBarHeight = 0,
}: MapTypesSheetProps) => {
  const handleSheetChanges = (index: number) => {};

  return (
    <BottomSheetModal
      ref={mapTypeSheetRef}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={true}
      bottomInset={tabBarHeight}
      containerStyle={{ bottom: tabBarHeight }}
    >
      <MapTypeBottomSheet
        currentMapType={mapType}
        onSelectMapType={handleSelectMapType}
      />
    </BottomSheetModal>
  );
};

export default MapTypesSheet;
