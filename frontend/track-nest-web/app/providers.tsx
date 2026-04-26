"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { EmergencyRequestRealtimeProvider } from "@/contexts/EmergencyRequestRealtimeContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <NotificationProvider>
          <EmergencyRequestRealtimeProvider>
            {children}
          </EmergencyRequestRealtimeProvider>
        </NotificationProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
