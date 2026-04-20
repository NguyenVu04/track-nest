"use client";

import { memo } from "react";
import Link from "next/link";
import { LogOut, Bell, Languages } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { useLocale, type Locale } from "@/contexts/LocaleContext";

interface HeaderProps {
  user: {
    fullName: string;
    role: string;
  };
  onLogout: () => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getRoleBadgeStyle(role: string) {
  switch (role) {
    case "Emergency Services":
      return "bg-orange-100 text-orange-700";
    case "Reporter":
      return "bg-brand-100 text-brand-700";
    case "Admin":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

const LOCALES: { value: Locale; flag: string }[] = [
  { value: "en", flag: "🇬🇧" },
  { value: "vi", flag: "🇻🇳" },
];

export const Header = memo(function Header({ user, onLogout }: HeaderProps) {
  const t = useTranslations("auth");
  const tLang = useTranslations("language");
  const { locale, setLocale } = useLocale();

  return (
    <header
      data-testid="app-header"
      className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sticky top-0 z-30 shadow-sm"
    >
      {/* Sidebar toggle */}
      <SidebarTrigger className="-ml-1 text-slate-500 hover:text-slate-900" />
      <Separator orientation="vertical" className="h-5 bg-slate-200" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* ── Language switcher ── */}
        <div
          className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
          data-testid="language-switcher"
          aria-label={tLang("toggle")}
        >
          <Languages className="size-3.5 text-slate-400 mx-1.5 shrink-0" />
          {LOCALES.map(({ value, flag }) => (
            <button
              key={value}
              onClick={() => setLocale(value)}
              data-testid={`lang-btn-${value}`}
              aria-pressed={locale === value}
              className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                locale === value
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white"
              }`}
            >
              {flag} {tLang(value)}
            </button>
          ))}
        </div>

        {/* Notification bell */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        {/* User pill */}
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-500 text-white text-xs font-semibold shrink-0">
            {getInitials(user.fullName)}
          </span>

          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-medium text-slate-800 max-w-30 truncate">
              {user.fullName}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getRoleBadgeStyle(user.role)}`}
            >
              {user.role}
            </span>
          </div>
        </Link>

        {/* Logout */}
        <button
          onClick={onLogout}
          data-testid="logout-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          title={t("signOut")}
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline font-medium">{t("signOut")}</span>
        </button>
      </div>
    </header>
  );
});
