import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, radii, spacing } from "@/styles/styles";

type MyInfoSheetProps = {
  myInfoSheetRef: React.RefObject<BottomSheetModal | null>;
  renderBackdrop: (props: any) => React.ReactElement;
  tabBarHeight?: number;
  containerStyle?: StyleProp<ViewStyle>;
  maxDynamicContentSize: number;
  title: string;
  nameLabel: string;
  addressLabel: string;
  speedLabel: string;
  timeSpentLabel: string;
  coordinatesLabel: string;
  lastUpdatedLabel: string;
  resolvingAddressLabel: string;
  notAvailableLabel: string;
  myAddress: string | null;
  speedKmh: number | null;
  timeSpentAtPlace: string | null;
  latitude: number;
  longitude: number;
  lastUpdatedText: string | null;
};

type StatTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit?: string;
};

function StatTile({ icon, label, value, unit }: StatTileProps) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statIconRow}>
        <Ionicons name={icon} size={13} color={colors.textMuted} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export default function MyInfoSheet({
  myInfoSheetRef,
  renderBackdrop,
  tabBarHeight = 0,
  containerStyle,
  maxDynamicContentSize,
  title,
  nameLabel,
  addressLabel,
  speedLabel,
  timeSpentLabel,
  coordinatesLabel,
  lastUpdatedLabel,
  resolvingAddressLabel,
  notAvailableLabel,
  myAddress,
  speedKmh,
  timeSpentAtPlace,
  latitude,
  longitude,
  lastUpdatedText,
}: MyInfoSheetProps) {
  const avatarLetter = title.trim().charAt(0).toUpperCase() || "M";
  const resolvedAddress = myAddress ?? resolvingAddressLabel;
  const speedValue = speedKmh != null ? `${speedKmh}` : notAvailableLabel;
  const speedUnit = speedKmh != null ? "km/h" : undefined;
  const timeValue = timeSpentAtPlace ?? notAvailableLabel;
  const coordinatesValue = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  const updatedValue = lastUpdatedText ?? notAvailableLabel;

  const getActivityState = (speed: number | null) => {
    if (speed == null) return { label: "STATIONARY", icon: "pause-circle-outline" as const };
    if (speed < 2) return { label: "STATIONARY", icon: "pause-circle-outline" as const };
    if (speed <= 10) return { label: "WALKING", icon: "walk-outline" as const };
    return { label: "DRIVING", icon: "car-outline" as const };
  };
  const activity = getActivityState(speedKmh);

  return (
    <BottomSheetModal
      ref={myInfoSheetRef}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={true}
      maxDynamicContentSize={maxDynamicContentSize}
      index={0}
      bottomInset={tabBarHeight}
      containerStyle={containerStyle}
    >
      <BottomSheetView style={styles.sheetContainer}>
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </View>
            <View style={styles.nameBlock}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active Now</Text>
              </View>
            </View>
          </View>

          <View style={styles.locationRow}>
            <View style={styles.locationIconWrap}>
              <Ionicons name="location" size={14} color={colors.primary} />
            </View>
            <View style={styles.locationTexts}>
              <Text style={styles.locationLabel}>{addressLabel}</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {resolvedAddress}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatTile
              icon={activity.icon}
              label={activity.label}
              value={speedValue}
              unit={speedUnit}
            />
            <StatTile
              icon="time-outline"
              label={timeSpentLabel}
              value={timeValue}
            />
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{nameLabel}</Text>
              <Text style={styles.detailValue}>{title}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{coordinatesLabel}</Text>
              <Text style={styles.detailValue}>{coordinatesValue}</Text>
            </View>

            <View style={styles.detailRowLast}>
              <Text style={styles.detailLabel}>{lastUpdatedLabel}</Text>
              <Text style={styles.detailValue}>{updatedValue}</Text>
            </View>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  avatarLetter: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  nameBlock: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  locationIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  locationTexts: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  locationAddress: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
    marginTop: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  statTile: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: radii.md,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  statIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  detailCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
  detailRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 4,
  },
  detailRowLast: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
  },
});
