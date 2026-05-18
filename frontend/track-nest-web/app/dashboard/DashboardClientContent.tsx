"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/loading/Loading";
import { Header } from "@/components/layout/Header";
import { AppSidebar } from "@/components/layout/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useReportPolling } from "@/hooks/useReportPolling";
import type { UserRole } from "@/types";

const ROLE_ROUTES: Record<string, UserRole[]> = {
  "/dashboard/missing-persons":    ["Reporter"],
  "/dashboard/crime-reports":      ["Reporter"],
  "/dashboard/guidelines":         ["Reporter"],
  "/dashboard/emergency-requests": ["Emergency Service", "Admin"],
  "/dashboard/safe-zones":         ["Emergency Service"],
  "/dashboard/accounts":           ["Admin"],
};

export function DashboardClientContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useReportPolling(!!user);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user) {
      const restricted = Object.entries(ROLE_ROUTES).find(([route]) =>
        pathname.startsWith(route),
      );
      if (restricted && !restricted[1].some(r => user.role.includes(r))) {
        router.replace("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar pathname={pathname} userRoles={user.role} />
      <SidebarInset>
        <Header user={user} onLogout={handleLogout} />
        <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
