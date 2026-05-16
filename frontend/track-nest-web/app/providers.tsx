"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { EmergencyRequestRealtimeProvider } from "@/contexts/EmergencyRequestRealtimeContext";
import { ReportRealtimeProvider } from "@/contexts/ReportRealtimeContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <NotificationProvider>
          <EmergencyRequestRealtimeProvider>
            <ReportRealtimeProvider>
              {children}
            </ReportRealtimeProvider>
          </EmergencyRequestRealtimeProvider>
        </NotificationProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
