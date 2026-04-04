"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import type { User } from "@/types";
import { authService } from "@/services/authService";

interface AuthContextType {
  user: User | null;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = "auth_user";

const mapRole = (role: string) => {
  if (role === "reporter") return "Reporter" as const;
  if (role === "emergency_services") return "Emergency Services" as const;
  if (role === "admin") return "Admin" as const;
  return "User" as const;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authenticated = await authService.initKeycloak();

        if (authenticated) {
          const userInfo = await authService.getUserInfo();
          if (userInfo) {
            const role = authService.getUserRole() || "user";
            const mappedUser = {
              id: userInfo.sub,
              username: userInfo.preferred_username || userInfo.name || "",
              email: userInfo.email || "",
              role: mapRole(role),
              fullName: userInfo.name || userInfo.preferred_username || "",
            };

            setUser(mappedUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedUser));
            return;
          }
        }

        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error("Failed to restore user from localStorage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (userData: User) => {
    setUser(userData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to save user to localStorage:", error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error("Failed to clear user from localStorage:", error);
      }
    }
  }, []);

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
