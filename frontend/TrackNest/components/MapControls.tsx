import Fab from "@/components/Fab";
import SosFab from "@/components/SosFab";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import React, { useCallback, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MapType } from "react-native-maps";

type Props = {
  onCenter?: (() => void) | null;
  centerActive?: boolean;
  onZoomIn?: (() => void) | null;
  onZoomOut?: (() => void) | null;
  onMapTypePress?: (() => void) | null;
  onToggleHeatmap?: (() => void) | null;
  onTogglePOIs?: (() => void) | null;
  onToggleSafeZones?: (() => void) | null;
  style?: object;
  mapType?: MapType;
  showHeatmap?: boolean;
  showPOIs?: boolean;
  showSafeZones?: boolean;
};

export default function MapControls({
  onCenter,
  centerActive = true,
  onZoomIn,
  onZoomOut,
  onMapTypePress,
  onToggleHeatmap,
  onTogglePOIs,
  onToggleSafeZones,
  style,
  mapType = "standard",
  showHeatmap = false,
  showPOIs = true,
  showSafeZones = true,
}: Props) {
  const tabBarHeight = useBottomTabBarHeight();

  const sheetRef = useRef<BottomSheetModal>(null);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.3}
        pressBehavior="close"
        style={[props.style, { bottom: tabBarHeight }]}
      />
    ),
    [tabBarHeight],
  );

  const labelByType: Partial<Record<MapType, string>> = {
    standard: "S",
    hybrid: "H",
  };
  const label = labelByType[mapType] ?? "S";

  const mapTypeNameByType: Partial<Record<MapType, string>> = {
    standard: "Standard",
    hybrid: "Hybrid",
  };
  const mapTypeName = mapTypeNameByType[mapType] ?? "Standard";

  const hasGroupedOptions =
    onMapTypePress || onToggleHeatmap || onTogglePOIs || onToggleSafeZones || onZoomIn || onZoomOut;

  return (
    <>
      <View style={[styles.fabColumn, style, { bottom: '10%' }]}>
        {hasGroupedOptions && (
          <Fab icon="menu" onPress={() => sheetRef.current?.present()} />
        )}
        {onCenter && (
          <Fab
            icon="navigate-outline"
            onPress={onCenter}
            color={centerActive ? "#0c6874" : "#94a3b8"}
            style={
              centerActive ? styles.centerFabActive : styles.centerFabInactive
            }
          />
        )}
        <SosFab />
      </View>

      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        bottomInset={tabBarHeight}
        containerStyle={{ bottom: tabBarHeight }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Map Options</Text>

          {onMapTypePress && (
            <Pressable style={styles.optionRow} onPress={onMapTypePress}>
              <View
                style={[styles.optionIconWrap, { backgroundColor: "#e0f4f8" }]}
              >
                <Ionicons name="layers-outline" size={22} color="#74becb" />
              </View>
              <View style={styles.optionMeta}>
                <Text style={styles.optionLabel}>Map Type</Text>
                <Text
                  style={styles.optionDesc}
                >{`Current: ${mapTypeName}`}</Text>
              </View>
              <View style={styles.mapTypeBadge}>
                <Text style={styles.mapTypeBadgeText}>{label}</Text>
              </View>
            </Pressable>
          )}

          {onToggleSafeZones && (
            <Pressable style={styles.optionRow} onPress={onToggleSafeZones}>
              <View
                style={[
                  styles.optionIconWrap,
                  { backgroundColor: showSafeZones ? "#dcfce7" : "#f3f4f6" },
                ]}
              >
                <Ionicons
                  name={showSafeZones ? "shield-checkmark" : "shield-checkmark-outline"}
                  size={22}
                  color={showSafeZones ? "#16a34a" : "#757575"}
                />
              </View>
              <View style={styles.optionMeta}>
                <Text style={styles.optionLabel}>Safe Zones</Text>
                <Text style={styles.optionDesc}>
                  Show safety boundaries on the map
                </Text>
              </View>
              <View
                style={[
                  styles.togglePill,
                  showSafeZones && styles.togglePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    showSafeZones && styles.toggleTextActive,
                  ]}
                >
                  {showSafeZones ? "ON" : "OFF"}
                </Text>
              </View>
            </Pressable>
          )}

          {onToggleHeatmap && (
            <Pressable style={styles.optionRow} onPress={onToggleHeatmap}>
              <View
                style={[
                  styles.optionIconWrap,
                  { backgroundColor: showHeatmap ? "#fde8e8" : "#f3f4f6" },
                ]}
              >
                <Ionicons
                  name={showHeatmap ? "flame" : "flame-outline"}
                  size={22}
                  color={showHeatmap ? "#e74c3c" : "#757575"}
                />
              </View>
              <View style={styles.optionMeta}>
                <Text style={styles.optionLabel}>Crime Heatmap</Text>
                <Text style={styles.optionDesc}>
                  Highlight crime hotspot areas on the map
                </Text>
              </View>
              <View
                style={[
                  styles.togglePill,
                  showHeatmap && styles.togglePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    showHeatmap && styles.toggleTextActive,
                  ]}
                >
                  {showHeatmap ? "ON" : "OFF"}
                </Text>
              </View>
            </Pressable>
          )}

          {onTogglePOIs && (
            <Pressable style={styles.optionRow} onPress={onTogglePOIs}>
              <View
                style={[
                  styles.optionIconWrap,
                  { backgroundColor: showPOIs ? "#e0f4f8" : "#f3f4f6" },
                ]}
              >
                <Ionicons
                  name={showPOIs ? "business" : "business-outline"}
                  size={22}
                  color={showPOIs ? "#74becb" : "#757575"}
                />
              </View>
              <View style={styles.optionMeta}>
                <Text style={styles.optionLabel}>Points of Interest</Text>
                <Text style={styles.optionDesc}>
                  Show landmarks and notable locations
                </Text>
              </View>
              <View
                style={[styles.togglePill, showPOIs && styles.togglePillActive]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    showPOIs && styles.toggleTextActive,
                  ]}
                >
                  {showPOIs ? "ON" : "OFF"}
                </Text>
              </View>
            </Pressable>
          )}

          {(onZoomIn || onZoomOut) && (
            <View style={styles.optionRow}>
              <View
                style={[styles.optionIconWrap, { backgroundColor: "#f3f4f6" }]}
              >
                <Ionicons name="search" size={22} color="#757575" />
              </View>
              <View style={styles.optionMeta}>
                <Text style={styles.optionLabel}>Zoom</Text>
                <Text style={styles.optionDesc}>Adjust the map zoom level</Text>
              </View>
              <View style={styles.zoomGroup}>
                {onZoomOut && (
                  <Pressable style={styles.zoomBtn} onPress={onZoomOut}>
                    <Ionicons name="remove" size={18} color="#333" />
                  </Pressable>
                )}
                {onZoomIn && (
                  <Pressable style={styles.zoomBtn} onPress={onZoomIn}>
                    <Ionicons name="add" size={18} color="#333" />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          <View style={styles.sheetFooter} />
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  fabColumn: {
    position: "absolute",
    right: 12,
    gap: 12,
    flexDirection: "column",
    alignItems: "flex-end",
  },
  centerFabActive: {
    backgroundColor: "#e6f4f6",
    borderWidth: 1,
    borderColor: "#bfe4e9",
  },
  centerFabInactive: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    flex: 1,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  sheetFooter: {
    height: 32,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionMeta: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  optionDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  mapTypeBadge: {
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "#e0f4f8",
    alignItems: "center",
    justifyContent: "center",
  },
  mapTypeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2f8fa0",
  },

  togglePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
  },
  togglePillActive: {
    backgroundColor: "#74becb",
  },
  toggleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
  },
  toggleTextActive: {
    color: "#fff",
  },

  zoomGroup: {
    flexDirection: "row",
    gap: 8,
  },
  zoomBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
});
