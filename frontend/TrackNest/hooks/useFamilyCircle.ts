import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import { mockFamilyCircles } from "@/constant/mockFamilyCircles";
import { FamilyCircle } from "@/constant/types";

const STORAGE_KEY = "@tracknest/selected_family_circle";

/**
 * Hook to manage the selected family circle with persistence to device storage
 */
export const useFamilyCircle = () => {
  const [selectedCircle, setSelectedCircle] = useState<FamilyCircle | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load saved circle from storage on mount
  useEffect(() => {
    const loadSavedCircle = async () => {
      try {
        const savedCircleId = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedCircleId) {
          // Find the circle in our available circles
          const circle = mockFamilyCircles.find(
            (c) => c.familyCircleId === savedCircleId,
          );
          if (circle) {
            setSelectedCircle(circle);
          } else {
            // Saved circle not found, use first available
            setSelectedCircle(mockFamilyCircles[0] ?? null);
          }
        } else {
          // No saved circle, use first available
          setSelectedCircle(mockFamilyCircles[0] ?? null);
        }
      } catch (error) {
        console.error("Failed to load saved family circle:", error);
        // Fallback to first circle
        setSelectedCircle(mockFamilyCircles[0] ?? null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedCircle();
  }, []);

  // Save and update selected circle
  const selectCircle = useCallback(async (circle: FamilyCircle) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, circle.familyCircleId);
      setSelectedCircle(circle);
    } catch (error) {
      console.error("Failed to save family circle:", error);
      // Still update state even if storage fails
      setSelectedCircle(circle);
    }
  }, []);

  // Clear saved circle
  const clearSavedCircle = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSelectedCircle(null);
    } catch (error) {
      console.error("Failed to clear saved family circle:", error);
    }
  }, []);

  return {
    selectedCircle,
    selectCircle,
    clearSavedCircle,
    isLoading,
  };
};
