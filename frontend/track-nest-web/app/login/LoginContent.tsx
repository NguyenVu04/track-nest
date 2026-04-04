"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function LoginContentInner() {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

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
      <h1 className="text-indigo-900 mb-2 text-2xl font-bold">TRACK Nest</h1>
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
      <Suspense
        fallback={
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          </div>
        }
      >
        <LoginContentInner />
      </Suspense>
    </div>
  );
}
