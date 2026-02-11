import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import { MapType } from "react-native-maps";

import { MapTypeBottomSheet } from "../MapTypeBottomSheet";

type MapTypesSheetProps = {
  mapTypeSheetRef: React.RefObject<BottomSheetModal | null>;
  renderBackdrop: (props: any) => React.ReactElement;
  mapType: MapType;
  handleSelectMapType: (type: MapType) => void;
};

const MapTypesSheet = ({
  mapTypeSheetRef,
  renderBackdrop,
  mapType,
  handleSelectMapType,
}: MapTypesSheetProps) => {
  const handleSheetChanges = (index: number) => {};

  return (
    <BottomSheetModal
      ref={mapTypeSheetRef}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={true}
    >
      <MapTypeBottomSheet
        currentMapType={mapType}
        onSelectMapType={handleSelectMapType}
      />
    </BottomSheetModal>
  );
};

export default MapTypesSheet;
