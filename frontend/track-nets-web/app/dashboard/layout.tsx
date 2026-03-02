"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/loading/Loading";
import { Header } from "@/components/layout/Header";
import { AppSidebar } from "@/components/layout/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for auth to finish loading before checking authentication
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading) {
    // Show loading spinner while auth state is being restored
    return <Loading fullScreen />;
  }

  if (!isAuthenticated || !user) {
    return null; // Router will redirect to login
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar pathname={pathname} />
      <SidebarInset>
        <Header user={user} onLogout={handleLogout} />
        <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
