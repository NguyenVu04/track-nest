"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const KEYCLOAK_BASE_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080";
const USER_REALM = process.env.NEXT_PUBLIC_USER_REALM || "public-dev";

function LoginContentInner() {
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const handleOAuthCallback = useCallback(async (authCode: string) => {
    try {
      setIsLoading(true);
      const redirectUri = typeof window !== "undefined" 
        ? `${window.location.origin}/login` 
        : "http://localhost:3000/login";

      await authService.exchangeCodeForToken(authCode, redirectUri);

      const userInfo = await authService.getUserInfo();
      if (!userInfo) {
        throw new Error("Failed to get user info");
      }
      
      const role = authService.getUserRole() || "user";
      const userRole = role === "reporter" ? "Reporter" : 
                       role === "emergency_services" ? "Emergency Services" : 
                       role === "admin" ? "Admin" : "User";

      const user = {
        id: userInfo.sub,
        username: userInfo.preferred_username || userInfo.name || "",
        email: userInfo.email || "",
        role: userRole as any,
        fullName: userInfo.name || userInfo.preferred_username || "",
      };

      login(user);
      toast.success(`Welcome, ${user.fullName}!`);
      router.push("/dashboard/missing-persons");
    } catch (err) {
      console.error("OAuth callback error:", err);
      toast.error("Login failed. Please try again.");
      setIsLoading(false);
      setShowLoginForm(true);
    }
  }, [login, router]);

  const redirectToKeycloak = useCallback(() => {
    const clientId = "tracknest";
    const redirectUri = typeof window !== "undefined" 
      ? `${window.location.origin}/login` 
      : "http://localhost:3000/login";
    
    const keycloakLoginUrl = `${KEYCLOAK_BASE_URL}/realms/${USER_REALM}/protocol/openid-connect/auth`
      + `?client_id=${encodeURIComponent(clientId)}`
      + `&redirect_uri=${encodeURIComponent(redirectUri)}`
      + `&response_type=code`
      + `&scope=openid%20profile%20email`
      + `&response_mode=query`;

    window.location.href = keycloakLoginUrl;
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard/missing-persons");
      return;
    }

    if (error) {
      toast.error(errorDescription || "Authentication failed");
      setIsLoading(false);
      setShowLoginForm(true);
      return;
    }

    if (code) {
      handleOAuthCallback(code);
    } else if (!isLoading) {
      setShowLoginForm(true);
    }
  }, [isAuthenticated, code, error, errorDescription, handleOAuthCallback, router, isLoading]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-indigo-900 mb-2 text-2xl font-bold">
          TRACK Nest
        </h1>
        <p className="text-gray-600 mb-6">Redirecting to Keycloak...</p>
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
      </div>
    );
  }

  if (!showLoginForm) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
        <Lock className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-indigo-900 mb-2 text-2xl font-bold">
        TRACK Nest
      </h1>
      <p className="text-gray-600 mb-6">Sign in to access the dashboard</p>
      
      <button
        onClick={redirectToKeycloak}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Sign In with Keycloak
      </button>
    </div>
  );
}

export function LoginContent() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        </div>
      }>
        <LoginContentInner />
      </Suspense>
    </div>
  );
}
