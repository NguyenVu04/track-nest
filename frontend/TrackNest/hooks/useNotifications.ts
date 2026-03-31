import { useCallback, useEffect, useState } from "react";

import {
  clearRiskNotifications,
  clearTrackingNotifications,
  countRiskNotifications,
  countTrackingNotifications,
  deleteRiskNotification,
  deleteRiskNotifications,
  deleteTrackingNotification,
  deleteTrackingNotifications,
  listRiskNotifications,
  listTrackingNotifications,
} from "@/services/notifier";

export type AppNotification = {
  id: string;
  title: string;
  content: string;
  createdAtMs: number;
  memberUsername?: string;
  type: "tracking" | "risk";
};

const PAGE_SIZE = 20;

/**
 * Hook that manages tracking and risk notifications fetched from the server.
 * Provides fetch, count, per-item delete, batch tab-clear, and clear-all operations.
 */
export function useNotifications() {
  const [trackingNotifications, setTrackingNotifications] = useState<
    AppNotification[]
  >([]);
  const [riskNotifications, setRiskNotifications] = useState<AppNotification[]>(
    [],
  );
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch totals from server for badge count
  const fetchCount = useCallback(async () => {
    try {
      const [tc, rc] = await Promise.all([
        countTrackingNotifications(),
        countRiskNotifications(),
      ]);
      setTotalCount((tc.totalCount ?? 0) + (rc.totalCount ?? 0));
    } catch (err) {
      console.warn("Failed to count notifications:", err);
    }
  }, []);

  // Fetch the first page of both notification types
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [trackingRes, riskRes] = await Promise.all([
        listTrackingNotifications(PAGE_SIZE),
        listRiskNotifications(PAGE_SIZE),
      ]);
      setTrackingNotifications(
        trackingRes.trackingNotificationsList.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          createdAtMs: n.createdAtMs,
          memberUsername: n.memberUsername,
          type: "tracking" as const,
        })),
      );
      setRiskNotifications(
        riskRes.riskNotificationsList.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          createdAtMs: n.createdAtMs,
          memberUsername: n.memberUsername,
          type: "risk" as const,
        })),
      );
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load badge count on mount
  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Delete a single tracking notification
  const deleteTracking = useCallback(async (id: string) => {
    try {
      await deleteTrackingNotification(id);
      setTrackingNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotalCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn("Failed to delete tracking notification:", err);
    }
  }, []);

  // Delete a single risk notification
  const deleteRisk = useCallback(async (id: string) => {
    try {
      await deleteRiskNotification(id);
      setRiskNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotalCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn("Failed to delete risk notification:", err);
    }
  }, []);

  // Batch-delete all currently loaded tracking notifications (Clear tracking tab)
  const clearTrackingTab = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await deleteTrackingNotifications(ids);
      setTrackingNotifications([]);
      setTotalCount((c) => Math.max(0, c - ids.length));
    } catch (err) {
      console.warn("Failed to clear tracking tab:", err);
    }
  }, []);

  // Batch-delete all currently loaded risk notifications (Clear risk tab)
  const clearRiskTab = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await deleteRiskNotifications(ids);
      setRiskNotifications([]);
      setTotalCount((c) => Math.max(0, c - ids.length));
    } catch (err) {
      console.warn("Failed to clear risk tab:", err);
    }
  }, []);

  // Server-side clear ALL notifications (beyond current page too)
  const clearAll = useCallback(async () => {
    try {
      await Promise.all([
        clearTrackingNotifications(),
        clearRiskNotifications(),
      ]);
      setTrackingNotifications([]);
      setRiskNotifications([]);
      setTotalCount(0);
    } catch (err) {
      console.warn("Failed to clear all notifications:", err);
    }
  }, []);

  return {
    trackingNotifications,
    riskNotifications,
    totalCount,
    loading,
    fetchAll,
    fetchCount,
    clearAll,
    clearTrackingTab,
    clearRiskTab,
    deleteTracking,
    deleteRisk,
  };
}
