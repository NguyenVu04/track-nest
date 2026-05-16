"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification, type NotificationType } from "@/contexts/NotificationContext";
import { authService } from "@/services/authService";

const WS_URL =
  process.env.NEXT_PUBLIC_CRIMINAL_REPORTS_WS_URL ??
  "http://localhost:8800/criminal-reports/ws";

interface ReportEvent {
  eventType: "CREATED" | "PUBLISHED" | "DELETED";
  reportId: string;
  title: string;
  reportType: "missing-person" | "crime" | "guideline";
}

const TOPIC_MAP: Record<ReportEvent["reportType"], string> = {
  "missing-person": "/topic/reports/missing-person",
  crime:            "/topic/reports/crime",
  guideline:        "/topic/reports/guideline",
};

const TITLE_MAP: Record<string, Record<ReportEvent["eventType"], string>> = {
  "missing-person": {
    CREATED:   "New missing person report",
    PUBLISHED: "Missing person report published",
    DELETED:   "Missing person report deleted",
  },
  crime: {
    CREATED:   "New crime report",
    PUBLISHED: "Crime report published",
    DELETED:   "Crime report deleted",
  },
  guideline: {
    CREATED:   "New guideline",
    PUBLISHED: "Guideline published",
    DELETED:   "Guideline deleted",
  },
};

const ReportRealtimeContext = createContext<null>(null);

export function ReportRealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (!user) return;

    const token = authService.getAccessToken();
    if (!token) return;

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${WS_URL}?access_token=${encodeURIComponent(token)}`),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      Object.entries(TOPIC_MAP).forEach(([reportType, topic]) => {
        client.subscribe(topic, (msg) => {
          try {
            const event: ReportEvent = JSON.parse(msg.body);
            const type = event.reportType ?? (reportType as ReportEvent["reportType"]);
            const titleMap = TITLE_MAP[type] ?? TITLE_MAP["missing-person"];
            addNotification({
              type: type as NotificationType,
              title: titleMap[event.eventType] ?? `${type} ${event.eventType.toLowerCase()}`,
              description: event.title,
              reportId: event.reportId,
            });
          } catch {
            console.error("[ReportRealtime] Failed to parse message from", topic);
          }
        });
      });
    };

    client.onStompError = (frame) => {
      console.error("[ReportRealtime] STOMP error:", frame.headers["message"]);
    };

    client.activate();
    return () => { client.deactivate(); };
  }, [user, addNotification]);

  return (
    <ReportRealtimeContext.Provider value={null}>
      {children}
    </ReportRealtimeContext.Provider>
  );
}
