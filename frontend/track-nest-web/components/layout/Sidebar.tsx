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
  Radar,
} from "lucide-react";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useTranslations } from "next-intl";

interface AppSidebarProps {
  pathname: string;
  userRole: string;
}

export const AppSidebar = memo(function AppSidebar({
  pathname,
  userRole,
}: AppSidebarProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  const coreNav = [
    { href: "/dashboard",                  nameKey: "overview",        icon: LayoutDashboard },
    { href: "/dashboard/missing-persons",  nameKey: "missingPersons",  icon: Users           },
    { href: "/dashboard/crime-reports",    nameKey: "crimeReports",    icon: Shield          },
    { href: "/dashboard/guidelines",       nameKey: "guidelines",      icon: BookOpen        },
  ];

  const opsNav = [
    { href: "/dashboard/emergency-requests", nameKey: "emergencyRequests", icon: LifeBuoy, roles: ["Emergency Services"] },
    { href: "/dashboard/safe-zones",         nameKey: "safeZones",         icon: MapPin,   roles: ["Emergency Services"] },
  ];

  const adminNav = [
    { href: "/dashboard/accounts", nameKey: "accounts", icon: UserCircle },
  ];

  const visibleOps = opsNav.filter(
    (item) => !item.roles || item.roles.includes(userRole),
  );

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const NavItem = ({
    href,
    nameKey,
    icon: Icon,
  }: {
    href: string;
    nameKey: string;
    icon: typeof LayoutDashboard;
  }) => (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive(href)}>
        <Link
          href={href}
          className={
            isActive(href)
              ? "bg-brand-500/15! text-brand-400! font-medium"
              : "text-slate-400 hover:text-white! hover:bg-white/5!"
          }
        >
          <Icon
            className={`size-4 shrink-0 ${isActive(href) ? "text-brand-400" : ""}`}
          />
          <span className="text-sm">{t(nameKey as Parameters<typeof t>[0])}</span>
          {isActive(href) && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <SidebarPrimitive
      collapsible="offcanvas"
      className="border-r-0"
      style={{ background: "var(--color-sidebar-dark, #0d1e2b)" }}
    >
      {/* ── Brand header ── */}
      <SidebarHeader className="px-4 py-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-500/20 ring-1 ring-brand-500/40">
            <Radar className="size-5 text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">{t("brand")}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              {t("brandSubtitle")}
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-slate-600 px-2 mb-1">
            {t("sectionMain")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {coreNav.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleOps.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-slate-600 px-2 mb-1">
              {t("sectionOperations")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {visibleOps.map((item) => (
                  <NavItem key={item.href} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-slate-600 px-2 mb-1">
            {t("sectionAdministration")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {adminNav.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer badge ── */}
      <SidebarFooter className="px-4 py-4 border-t border-white/8">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-[11px] text-slate-500">{tCommon("systemOnline")}</p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </SidebarPrimitive>
  );
});
