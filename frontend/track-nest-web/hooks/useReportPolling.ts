import { useEffect, useRef } from "react";
import { useNotification } from "@/contexts/NotificationContext";
import { criminalReportsService } from "@/services/criminalReportsService";

const POLL_INTERVAL_MS = 30_000;

/**
 * Polls the three criminal-reports list endpoints every 30 s.
 * On each tick, surfaces any items whose createdAt is newer than the
 * previous tick as an in-app notification. This provides cross-session
 * delivery without requiring a backend WebSocket on criminal-reports.
 *
 * Mount once at the root dashboard level (DashboardClientContent).
 * Does nothing when `enabled` is false (unauthenticated state).
 */
export function useReportPolling(enabled: boolean) {
  const { addNotification } = useNotification();
  const lastSeenRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    // Baseline: items already existing at mount time are not surfaced as new
    lastSeenRef.current = Date.now();

    const tick = async () => {
      const since = lastSeenRef.current;
      lastSeenRef.current = Date.now();

      try {
        const [mpRes, crRes, glRes] = await Promise.all([
          criminalReportsService.listMissingPersonReports({ page: 0, size: 10 }),
          criminalReportsService.listCrimeReports({ page: 0, size: 10 }),
          criminalReportsService.listGuidelinesDocuments({ page: 0, size: 10 }),
        ]);

        mpRes.content
          .filter((r) => new Date(r.createdAt).getTime() > since)
          .forEach((r) =>
            addNotification({
              type: "missing-person",
              title: "New missing person report",
              description: r.title ?? r.fullName,
              reportId: r.id,
            }),
          );

        crRes.content
          .filter((r) => new Date(r.createdAt).getTime() > since)
          .forEach((r) =>
            addNotification({
              type: "crime",
              title: "New crime report",
              description: r.title,
              reportId: r.id,
            }),
          );

        glRes.content
          .filter((r) => new Date(r.createdAt).getTime() > since)
          .forEach((r) =>
            addNotification({
              type: "guideline",
              title: "New guideline",
              description: r.title,
              reportId: r.id,
            }),
          );
      } catch {
        // Polling failures are silent — the UI degrades gracefully
      }
    };

    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, addNotification]);
}
