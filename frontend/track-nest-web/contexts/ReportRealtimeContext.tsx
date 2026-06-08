"use client";

import { createContext, useEffect, ReactNode } from "react";
import { distinctUntilChanged, skip, takeUntil } from "rxjs";
import { useAuth } from "@/contexts/AuthContext";
import {
  useNotification,
  type NotificationType,
} from "@/contexts/NotificationContext";
import { authService } from "@/services/authService";
import { criminalReportsStomp } from "@/services/stompService";
import {
  createDestroy$,
  completeDestroy$,
  fromStompChannel,
} from "@/lib/rxjs-helpers";

interface ReportEvent {
  eventType: "CREATED" | "PUBLISHED" | "DELETED";
  reportId: string;
  title: string;
  reportType: "missing-person" | "crime" | "guideline";
}

const TOPIC_MAP: Record<ReportEvent["reportType"], string> = {
  "missing-person": "/topic/reports/missing-person",
  crime: "/topic/reports/crime",
  guideline: "/topic/reports/guideline",
};

const TITLE_MAP: Record<string, Record<ReportEvent["eventType"], string>> = {
  "missing-person": {
    CREATED: "New missing person report",
    PUBLISHED: "Missing person report published",
    DELETED: "Missing person report deleted",
  },
  crime: {
    CREATED: "New crime report",
    PUBLISHED: "Crime report published",
    DELETED: "Crime report deleted",
  },
  guideline: {
    CREATED: "New guideline",
    PUBLISHED: "Guideline published",
    DELETED: "Guideline deleted",
  },
};

const ReportRealtimeContext = createContext<null>(null);

export function ReportRealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (!user) return;

    const destroy$ = createDestroy$();

    (Object.entries(TOPIC_MAP) as [ReportEvent["reportType"], string][]).forEach(
      ([reportType, topic]) => {
        fromStompChannel(criminalReportsStomp, topic)
          .pipe(takeUntil(destroy$))
          .subscribe({
            next: (msg) => {
              try {
                const event: ReportEvent = JSON.parse(msg.body);
                const type = event.reportType ?? reportType;
                const titleMap = TITLE_MAP[type] ?? TITLE_MAP["missing-person"];
                addNotification({
                  type: type as NotificationType,
                  title:
                    titleMap[event.eventType] ??
                    `${type} ${event.eventType.toLowerCase()}`,
                  description: event.title,
                  reportId: event.reportId,
                });
              } catch {
                console.error(
                  "[ReportRealtime] Failed to parse message from",
                  topic,
                );
              }
            },
            error: (err) =>
              console.error("[ReportRealtime] channel error:", topic, err),
          });
      },
    );

    authService.token$
      .pipe(skip(1), distinctUntilChanged(), takeUntil(destroy$))
      .subscribe((token) => {
        if (token) {
          criminalReportsStomp
            .reconnect()
            .catch((err) =>
              console.error(
                "[ReportRealtime] reconnect after token refresh failed:",
                err,
              ),
            );
        }
      });

    return () => {
      completeDestroy$(destroy$);
    };
  }, [user, addNotification]);

  return (
    <ReportRealtimeContext.Provider value={null}>
      {children}
    </ReportRealtimeContext.Provider>
  );
}
