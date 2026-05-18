"use client";

import { Radar } from "lucide-react";
import { useTranslations } from "next-intl";
import { LottieLoader } from "./LottieLoader";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

const lottieSizes = {
  sm: 60,
  md: 100,
  lg: 140,
};

export function Loading({ size = "md", text, fullScreen = false }: LoadingProps) {
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");
  const displayText = text ?? t("loading");

  const content = (
    <div className="flex flex-col items-center justify-center gap-1">
      <LottieLoader size={lottieSizes[size]} />
      {displayText && <p className="text-sm text-slate-500">{displayText}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "linear-gradient(135deg, #0d1e2b 0%, #1a3347 100%)" }}
      >
        <div className="flex items-center gap-3">
          <Radar className="w-7 h-7 text-brand-400" />
          <span className="text-xl font-bold text-white tracking-wide">
            {tAuth("appName")}
          </span>
        </div>
        <LottieLoader size={160} />
        <p className="text-sm text-slate-400">{displayText}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-14">{content}</div>
  );
}
