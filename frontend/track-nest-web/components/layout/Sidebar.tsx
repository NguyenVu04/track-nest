"use client";

import { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  BookOpen,
  LifeBuoy,
  MapPin,
  UserCircle,
  PlusCircle,
  HelpCircle,
  LogOut,
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
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useTranslations } from "next-intl";
import type { UserRole } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface AppSidebarProps {
  pathname: string;
  userRoles: UserRole[];
}

type NavItem = {
  href: string;
  nameKey: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[] | null;
};

export const AppSidebar = memo(function AppSidebar({
  pathname,
  userRoles,
}: AppSidebarProps) {
  const t = useTranslations("nav");
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const hasRole = (allowed: UserRole[]) => allowed.some(r => userRoles.includes(r));

  const coreNav: NavItem[] = [
    { href: "/dashboard", nameKey: "overview", icon: LayoutDashboard, roles: null },
  ];
  const reporterNav: NavItem[] = [
    { href: "/dashboard/missing-persons", nameKey: "missingPersons", icon: Users, roles: ["Reporter"] },
    { href: "/dashboard/crime-reports", nameKey: "crimeReports", icon: Shield, roles: ["Reporter"] },
    { href: "/dashboard/guidelines", nameKey: "guidelines", icon: BookOpen, roles: ["Reporter"] },
  ];

  const opsNav: NavItem[] = [
    { href: "/dashboard/emergency-requests", nameKey: "emergencyRequests", icon: LifeBuoy, roles: ["Emergency Service"] },
    { href: "/dashboard/safe-zones", nameKey: "safeZones", icon: MapPin, roles: ["Emergency Service"] },
  ];

  const adminNav: NavItem[] = [
    { href: "/dashboard/accounts", nameKey: "accounts", icon: UserCircle, roles: ["Admin"] },
    { href: "/dashboard/emergency-requests/admin", nameKey: "emergencyRequests", icon: LifeBuoy, roles: ["Admin"] },
  ];

  // Combine all visible items into a flat list
  const allItems = [
    ...coreNav.filter((item) => !item.roles || hasRole(item.roles)),
    ...reporterNav.filter((item) => hasRole(item.roles!)),
    ...opsNav.filter((item) => hasRole(item.roles!)),
    ...adminNav.filter((item) => hasRole(item.roles!)),
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const NavItemComponent = ({ href, nameKey, icon: Icon }: Omit<NavItem, "roles">) => {
    const active = isActive(href);
    return (
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild 
          isActive={active} 
          className="h-auto p-0 hover:bg-transparent active:bg-transparent hover:text-current data-[active=true]:bg-transparent data-[active=true]:text-current"
        >
          <Link
            href={href}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all duration-200 ${
              active
                ? "bg-[#e0f2f1] text-[#006064] font-bold"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-semibold"
            }`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${active ? "text-[#006064]" : "text-slate-400"}`} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[15px]">
              {t(nameKey as Parameters<typeof t>[0])}
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <SidebarPrimitive
      collapsible="offcanvas"
      className="border-r-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 [&_[data-slot=sidebar-inner]]:bg-white [&_[data-slot=sidebar-inner]]:rounded-r-[2.5rem] [&_[data-slot=sidebar-inner]]:border-r-0"
    >
      {/* ── Brand header ── */}
      <SidebarHeader className="px-8 pt-10 pb-8 border-b-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-extrabold text-[#006064] tracking-tight leading-none">
            TrackNest
          </h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">
            Family Sanctuary
          </p>
        </div>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent className="px-5 flex-1">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2.5">
              {allItems.map((item) => (
                <NavItemComponent key={item.href} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer Actions ── */}
      <SidebarFooter className="px-6 pb-10 pt-4">
        <div className="flex flex-col gap-5">
          <button className="flex items-center justify-center gap-2 bg-[#006064] hover:bg-[#004d40] text-white px-4 py-3.5 rounded-[1rem] font-bold shadow-md shadow-teal-900/10 transition-all duration-200">
            <PlusCircle className="w-[18px] h-[18px] stroke-[2.5]" />
            <span className="text-[15px]">Add Member</span>
          </button>

          <div className="flex flex-col gap-1 mt-2">
            <Link
              href="/dashboard/help"
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-semibold transition-colors"
            >
              <HelpCircle className="w-5 h-5 shrink-0 text-slate-400" />
              <span className="text-[14px]">Help Center</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-red-600 font-semibold transition-colors w-full text-left"
            >
              <LogOut className="w-5 h-5 shrink-0 text-slate-400" />
              <span className="text-[14px]">Sign Out</span>
            </button>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </SidebarPrimitive>
  );
});
