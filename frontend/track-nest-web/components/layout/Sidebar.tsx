"use client";

import { memo } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Shield,
  BookOpen,
  LifeBuoy,
  MapPin,
  UserCircle,
} from "lucide-react";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navigation = [
  {
    href: "/dashboard",
    name: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/missing-persons",
    name: "Missing Persons",
    icon: Users,
  },
  {
    href: "/dashboard/crime-reports",
    name: "Crime Reports",
    icon: Shield,
  },
  {
    href: "/dashboard/guidelines",
    name: "Guidelines",
    icon: BookOpen,
  },
  {
    href: "/dashboard/emergency-requests",
    name: "Emergency Requests",
    icon: LifeBuoy,
    roles: ["Emergency Services"],
  },
  {
    href: "/dashboard/safe-zones",
    name: "Safe Zones",
    icon: MapPin,
    roles: ["Emergency Services"],
  },
  {
    href: "/dashboard/accounts",
    name: "Accounts",
    icon: UserCircle,
  },
];

interface AppSidebarProps {
  pathname: string;
}

export const AppSidebar = memo(function AppSidebar({
  pathname,
}: AppSidebarProps) {
  return (
    <SidebarPrimitive collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Shield className="size-6 text-brand-500" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">TRACK</span>
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.href}
                        className={
                          isActive
                            ? "bg-brand-100 text-brand-700 hover:bg-brand-100 hover:text-brand-700"
                            : ""
                        }
                      >
                        <Icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </SidebarPrimitive>
  );
});
