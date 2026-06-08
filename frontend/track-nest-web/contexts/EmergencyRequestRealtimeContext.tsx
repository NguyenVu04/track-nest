"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { distinctUntilChanged, skip, takeUntil } from "rxjs";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import { authService } from "@/services/authService";
import { emergencyOpsStomp } from "@/services/stompService";
import {
  createDestroy$,
  completeDestroy$,
  fromStompChannel,
} from "@/lib/rxjs-helpers";

interface AssignedEmergencyRequestMessage {
  requestId: string;
  assignedAtMs: number;
}

interface EmergencyStatusMessage {
  requestId: string;
  status: "ACCEPTED" | "REJECTED" | "CLOSED";
  closedAtMs: number | null;
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
    if (!user) return;

    const isEmergencyService = user?.role?.includes("Emergency Service");
    const destroy$ = createDestroy$();

    // The managed stomp service auto-connects on first subscribe and pulls
    // a fresh JWT through authService.getFreshAccessToken() each handshake.
    // No need to capture the token here.
    if (isEmergencyService) {
      fromStompChannel(emergencyOpsStomp, "/user/queue/emergency-request")
        .pipe(takeUntil(destroy$))
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

      fromStompChannel(emergencyOpsStomp, "/user/queue/user-location")
        .pipe(takeUntil(destroy$))
        .subscribe({
          next: (message) => {
            try {
              const body = JSON.parse(message.body);
              setRealtimeLocation({
                userId: body.userId ?? "",
                latitude: body.latitudeDeg,
                longitude: body.longitudeDeg,
                timestamp: body.timestampMs ?? Date.now(),
              });
            } catch {
              console.error("Failed to parse location message");
            }
          },
          error: (err) =>
            console.error("[STOMP] location channel error:", err),
        });
    } else {
      fromStompChannel(emergencyOpsStomp, "/user/queue/emergency-request-status")
        .pipe(takeUntil(destroy$))
        .subscribe({
          next: (message) => {
            try {
              const body: EmergencyStatusMessage = JSON.parse(message.body);
              const label =
                body.status === "ACCEPTED"
                  ? "accepted"
                  : body.status === "REJECTED"
                    ? "rejected"
                    : "closed";
              addNotification({
                type: "emergency",
                title: `Emergency request ${label}`,
                description: `Your emergency request has been ${label}.`,
                reportId: body.requestId,
              });
              setRefresh((prev) => prev + 1);
            } catch {
              console.error("Failed to parse emergency status message");
            }
          },
          error: (err) =>
            console.error("[STOMP] emergency status channel error:", err),
        });
    }

    // Re-handshake the socket whenever Keycloak issues a refreshed JWT.
    // skip(1) discards the BehaviorSubject's current value so we only react
    // to actual refresh events, not the initial replay.
    authService.token$
      .pipe(skip(1), distinctUntilChanged(), takeUntil(destroy$))
      .subscribe((token) => {
        if (token) {
          emergencyOpsStomp
            .reconnect()
            .catch((err) =>
              console.error("[STOMP] reconnect after token refresh failed:", err),
            );
        }
      });

    return () => {
      completeDestroy$(destroy$);
      // Intentionally do NOT call emergencyOpsStomp.disconnect() here:
      // the service is a module-level singleton shared with any other
      // mounted consumer. Subscriptions clean themselves up via destroy$.
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
