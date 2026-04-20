"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Radar, ArrowRight, ShieldCheck, MapPin, Users } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

function LoginContentInner() {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");

  const redirectToKeycloak = useCallback(() => {
    authService.loginWithKeycloak().catch((error) => {
      console.error("Keycloak redirect failed:", error);
      toast.error("Unable to start Keycloak login. Please try again.");
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const authenticated = await authService.initKeycloak();
        if (authenticated || isAuthenticated) {
          router.push("/dashboard/missing-persons");
          return;
        }
      } catch (error) {
        console.error("Keycloak initialization failed:", error);
        toast.error("Authentication initialization failed.");
      } finally {
        setIsLoading(false);
      }
    };
    bootstrapAuth();
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-10 bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm text-slate-500">{t("initialisingSession")}</p>
      </div>
    );
  }

  const features = [
    { icon: ShieldCheck, label: t("featureCrimeReports") },
    { icon: Users,       label: t("featureMissingPersons") },
    { icon: MapPin,      label: t("featureSafeZones") },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl shadow-brand-900/10 w-full max-w-sm overflow-hidden">
      {/* Top teal accent bar */}
      <div className="h-1 w-full bg-linear-to-r from-brand-400 via-brand-500 to-brand-600" />

      <div className="px-8 py-10 text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 ring-1 ring-brand-200 mb-6">
          <Radar className="w-8 h-8 text-brand-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">{t("appName")}</h1>
        <p className="text-sm text-slate-500 mb-8">{t("tagline")}</p>

        <button
          onClick={redirectToKeycloak}
          className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-150 group"
        >
          {t("signIn")}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <p className="mt-6 text-xs text-slate-400">{t("securedBy")}</p>
      </div>

      {/* Feature pills */}
      <div className="border-t border-slate-100 px-8 py-5 grid grid-cols-3 gap-3">
        {features.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-50">
              <Icon className="w-4 h-4 text-brand-600" />
            </span>
            <span className="text-[10px] font-medium text-slate-500 text-center leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoginContent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
         style={{ background: "linear-gradient(135deg, #0d1e2b 0%, #1a3347 50%, #253f47 100%)" }}>
      {/* Decorative circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-brand-400/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center gap-4 p-10 bg-white rounded-2xl shadow-xl">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          }
        >
          <LoginContentInner />
        </Suspense>
      </div>
    </div>
  );
}
