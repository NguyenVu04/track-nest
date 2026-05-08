import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { FamilyCircle } from "@/constant/types";
import { listFamilyCircles } from "@/services/trackingManager";

export const STORAGE_KEY = "@tracknest/selected_family_circle";
const CIRCLES_CACHE_KEY = "@tracknest/family_circles_cache";
const PAGE_SIZE = 50;

/**
 * Hook to manage family circles fetched from the server,
 * with selected-circle persistence to device storage.
 */
export const useFamilyCircle = () => {
  const [circles, setCircles] = useState<FamilyCircle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<FamilyCircle | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(false);

  const fetchCircles = useCallback(async (): Promise<FamilyCircle[]> => {
    try {
      const response = await listFamilyCircles(PAGE_SIZE);
      const fetched: FamilyCircle[] = response.familyCirclesList.map((c) => ({
        familyCircleId: c.familyCircleId,
        name: c.name,
        createdAtMs: c.createdAtMs,
        role: c.familyRole || undefined,
        isAdmin: c.isAdmin,
      }));

      await AsyncStorage.setItem(CIRCLES_CACHE_KEY, JSON.stringify(fetched));
      setCircles(fetched);
      return fetched;
    } catch (error) {
      console.error("Failed to fetch family circles:", error);

      try {
        const cached = await AsyncStorage.getItem(CIRCLES_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as FamilyCircle[];
          setCircles([...parsed]);
          return parsed;
        }
      } catch (cacheError) {
        console.error("Failed to load cached circles:", cacheError);
      }

      setCircles([]);
      return [];
    }
  }, []);

  // Fetch circles and restore saved selection on mount
  useEffect(() => {
    const init = async () => {
      const fetched = await fetchCircles();
      try {
        const savedCircleId = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedCircleId) {
          const match = fetched.find((c) => c.familyCircleId === savedCircleId);
          setSelectedCircle(match ?? fetched[0] ?? null);
        } else {
          setSelectedCircle(fetched[0] ?? null);
        }
      } catch {
        setSelectedCircle(fetched[0] ?? null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [fetchCircles]);

  // Save and update selected circle
  const selectCircle = useCallback(async (circle: FamilyCircle) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, circle.familyCircleId);
      setSelectedCircle(circle);
    } catch (error) {
      console.error("Failed to save family circle:", error);
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

  // Refresh the circles list from the server
  const refreshCircles = useCallback(async () => {
    const fetched = await fetchCircles();
    // Re-validate selected circle still exists
    if (
      selectedCircle &&
      !fetched.find((c) => c.familyCircleId === selectedCircle.familyCircleId)
    ) {
      const next = fetched[0] ?? null;
      setSelectedCircle(next);
      if (next) {
        await AsyncStorage.setItem(STORAGE_KEY, next.familyCircleId);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [fetchCircles, selectedCircle]);

  // Re-fetch whenever the screen comes back into focus (e.g. after creating a new circle)
  useFocusEffect(
    useCallback(() => {
      if (!isMountedRef.current) {
        // Skip — the initial load is handled by the useEffect above
        isMountedRef.current = true;
        return;
      }
      refreshCircles();
    }, [refreshCircles]),
  );

  return {
    circles,
    selectedCircle,
    selectCircle,
    clearSavedCircle,
    refreshCircles,
    isLoading,
  };
};
