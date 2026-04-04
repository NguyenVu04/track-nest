"use client";

import { memo } from "react";
import Link from "next/link";
import { LogOut, UserCircle } from "lucide-react";
import { NotificationButton } from "../shared/NotificationButton";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface HeaderProps {
  user: {
    fullName: string;
    role: string;
  };
  onLogout: () => void;
}

export const Header = memo(function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 px-4 sticky top-0 z-30 bg-background">
      <SidebarTrigger className="-ml-1" />
      <div className="flex items-center gap-2 flex-1">
        <div>
          <h1 className="text-sm font-semibold">TRACK Dashboard</h1>
          <p className="text-xs text-muted-foreground">{user.role}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NotificationButton />
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-lg transition-colors"
        >
          <UserCircle className="size-5" />
          <span className="hidden sm:inline text-sm">{user.fullName}</span>
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
        >
          <LogOut className="size-5" />
          <span className="hidden sm:inline text-sm">Logout</span>
        </button>
      </div>
    </header>
  );
});
