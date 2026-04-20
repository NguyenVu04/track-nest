"use client";

import { Loader2, Radar } from "lucide-react";
import { useTranslations } from "next-intl";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-7 h-7",
  lg: "w-10 h-10",
};

export function Loading({ size = "md", text, fullScreen = false }: LoadingProps) {
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");
  const displayText = text ?? t("loading");

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} text-brand-500 animate-spin`} />
      {displayText && <p className="text-sm text-slate-500">{displayText}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: "linear-gradient(135deg, #0d1e2b 0%, #1a3347 100%)" }}
      >
        <div className="flex items-center gap-3">
          <Radar className="w-7 h-7 text-brand-400" />
          <span className="text-xl font-bold text-white tracking-wide">
            {tAuth("appName")}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-sm text-slate-400">{displayText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-14">{content}</div>
  );
}
