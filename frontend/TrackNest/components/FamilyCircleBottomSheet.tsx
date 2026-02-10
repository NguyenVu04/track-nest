import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { map as mapLang } from "@/constant/languages";
import { FamilyCircle } from "@/constant/types";
import { useTranslation } from "@/hooks/useTranslation";
import { BottomSheetView } from "@gorhom/bottom-sheet";

interface FamilyCircleBottomSheetProps {
  familyCircles: FamilyCircle[];
  selectedCircleId: string | null;
  onSelectCircle: (circle: FamilyCircle) => void;
  onAddFamilyCircle: () => void;
}

export const FamilyCircleBottomSheet: React.FC<
  FamilyCircleBottomSheetProps
> = ({ familyCircles, selectedCircleId, onSelectCircle, onAddFamilyCircle }) => {
  const t = useTranslation(mapLang);

  if (familyCircles.length === 0) {
    console.log("No family circles available");

    return (
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>{t.familyCircles}</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>{t.noFamilyCircles}</Text>
          <TouchableOpacity
            style={{
              marginTop: 16,
              backgroundColor: "#74becb",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 4,
            }}
            onPress={onAddFamilyCircle}
          >
            <Text
              style={{ color: "#fff", fontWeight: "600", textAlign: "center" }}
            >
              Add new circle
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    );
  }

  return (
    <BottomSheetView style={styles.container}>
      <Text style={styles.title}>{t.selectFamilyCircle}</Text>
      <View style={styles.listContainer}>
        {familyCircles.map((circle) => {
          const isSelected = circle.familyCircleId === selectedCircleId;
          return (
            <Pressable
              key={circle.familyCircleId}
              style={[styles.circleItem, isSelected && styles.selectedItem]}
              onPress={() => onSelectCircle(circle)}
            >
              <View
                style={[
                  styles.circleIcon,
                  isSelected && styles.selectedCircleIcon,
                ]}
              >
                <Ionicons
                  name="people"
                  size={24}
                  color={isSelected ? "#fff" : "#74becb"}
                />
              </View>
              <View style={styles.circleInfo}>
                <Text
                  style={[styles.circleName, isSelected && styles.selectedText]}
                >
                  {circle.name}
                </Text>
                <Text style={styles.circleMeta}>
                  {circle.memberCount} {t.members}
                  {circle.role === "admin" && " • Admin"}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color="#74becb" />
              )}
            </Pressable>
          );
        })}
        <TouchableOpacity
          style={{
            marginTop: 16,
            backgroundColor: "#74becb",
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 4,
          }}
          onPress={onAddFamilyCircle}
        >
          <Text
            style={{ color: "#fff", fontWeight: "600", textAlign: "center" }}
          >
            Add new circle
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheetView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  listContainer: {
    gap: 8,
  },
  circleItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    gap: 12,
  },
  selectedItem: {
    backgroundColor: "#e0f2f5",
    borderWidth: 1,
    borderColor: "#74becb",
  },
  circleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0f2f5",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCircleIcon: {
    backgroundColor: "#74becb",
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  selectedText: {
    color: "#5aa8b5",
  },
  circleMeta: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    marginTop: 12,
  },
});
