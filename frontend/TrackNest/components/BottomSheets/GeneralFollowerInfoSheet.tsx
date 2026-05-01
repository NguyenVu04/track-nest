import { BottomSheetFlatList, BottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import { StyleSheet, useWindowDimensions } from "react-native";

type GeneralFollowerInfoSheetProps = {
  generalInfoSheetRef: React.RefObject<BottomSheetModal | null>;
  generalInfoListData: any[];
  generalInfoRenderItem: ({ item }: { item: any }) => React.ReactElement;
  tabBarHeight?: number;
};

const GeneralFollowerInfoSheet = ({
  generalInfoSheetRef,
  generalInfoListData,
  generalInfoRenderItem,
  tabBarHeight = 0,
}: GeneralFollowerInfoSheetProps) => {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <BottomSheetModal
      ref={generalInfoSheetRef}
      style={styles.generalInfoSheet}
      enableDynamicSizing={true}
      maxDynamicContentSize={Math.floor(screenHeight * 0.45)}
      index={0}
      enableContentPanningGesture={false}
      bottomInset={tabBarHeight}
      containerStyle={{ bottom: tabBarHeight }}
    >
      <BottomSheetFlatList
        data={generalInfoListData}
        horizontal
        snapToInterval={100}
        keyExtractor={(_: any, index: any) => index}
        decelerationRate="normal"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 24 }}
        renderItem={generalInfoRenderItem}
      />
    </BottomSheetModal>
  );
};

export default GeneralFollowerInfoSheet;

const styles = StyleSheet.create({
  generalInfoSheet: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
});
