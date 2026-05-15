"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { defer, from, switchMap, takeUntil } from "rxjs";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import { authService } from "@/services/authService";
import stompService from "@/services/stompService";
import {
  createDestroy$,
  completeDestroy$,
  fromStompChannel,
} from "@/lib/rxjs-helpers";

interface AssignedEmergencyRequestMessage {
  requestId: string;
  assignedAtMs: number;
}

export interface RealtimeLocation {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface EmergencyRequestRealtimeContextType {
  refresh: number;
  realtimeLocation: RealtimeLocation | null;
}

const EmergencyRequestRealtimeContext = createContext<
  EmergencyRequestRealtimeContextType | undefined
>(undefined);

export function EmergencyRequestRealtimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [refresh, setRefresh] = useState(0);
  const [realtimeLocation, setRealtimeLocation] =
    useState<RealtimeLocation | null>(null);

  useEffect(() => {
    if (!user?.role?.includes("Emergency Service")) return;

    const token = authService.getAccessToken();
    if (!token) return;

    const destroy$ = createDestroy$();

    // Lazy connect — re-executes on each subscription (Strict Mode safe)
    const connect$ = defer(() => from(stompService.connect(token)));

    // Emergency request channel
    connect$
      .pipe(
        switchMap(() =>
          fromStompChannel("/user/queue/emergency-request"),
        ),
        takeUntil(destroy$),
      )
      .subscribe({
        next: (message) => {
          try {
            const body: AssignedEmergencyRequestMessage = JSON.parse(
              message.body,
            );
            addNotification({
              type: "emergency",
              title: "New Emergency Request",
              description: `Emergency request #${body.requestId.substring(0, 8)} has been assigned to your service.`,
              reportId: body.requestId,
            });
            setRefresh((prev) => prev + 1);
          } catch {
            console.error("Failed to parse emergency request message");
          }
        },
        error: (err) =>
          console.error("[STOMP] emergency channel error:", err),
      });

    // Live location channel
    connect$
      .pipe(
        switchMap(() =>
          fromStompChannel("/user/queue/user-location"),
        ),
        takeUntil(destroy$),
      )
      .subscribe({
        next: (message) => {
          try {
            const body = JSON.parse(message.body);
            setRealtimeLocation({
              userId: body.userId ?? "",
              latitude: body.latitude,
              longitude: body.longitude,
              timestamp: body.timestamp ?? Date.now(),
            });
          } catch {
            console.error("Failed to parse location message");
          }
        },
        error: (err) =>
          console.error("[STOMP] location channel error:", err),
      });

    return () => {
      completeDestroy$(destroy$);
      stompService.disconnect();
    };
  }, [user, addNotification]);

  return (
    <EmergencyRequestRealtimeContext.Provider value={{ refresh, realtimeLocation }}>
      {children}
    </EmergencyRequestRealtimeContext.Provider>
  );
}

export function useEmergencyRequestRealtime() {
  const context = useContext(EmergencyRequestRealtimeContext);
  if (context === undefined) {
    throw new Error(
      "useEmergencyRequestRealtime must be used within EmergencyRequestRealtimeProvider",
    );
  }
  return context;
}
