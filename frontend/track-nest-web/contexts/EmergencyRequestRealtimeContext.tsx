"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import { authService } from "@/services/authService";
import stompService from "@/services/stompService";
import type { StompSubscription } from "@stomp/stompjs";

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
  const [realtimeLocation, setRealtimeLocation] = useState<RealtimeLocation | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const locationSubscriptionRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    if (!user?.role?.includes("Emergency Service")) return;

    const token = authService.getAccessToken();
    if (!token) return;

    let cancelled = false;

    stompService
      .connect(token)
      .then(() => {
        if (cancelled) {
          stompService.disconnect();
          return;
        }

        subscriptionRef.current = stompService.subscribe(
          "/user/queue/emergency-request",
          (message) => {
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
        );

        locationSubscriptionRef.current = stompService.subscribe(
          "/user/queue/user-location",
          (message) => {
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
        );
      })
      .catch((err) => {
        console.error("STOMP connection failed:", err);
      });

    return () => {
      cancelled = true;
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      locationSubscriptionRef.current?.unsubscribe();
      locationSubscriptionRef.current = null;
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
