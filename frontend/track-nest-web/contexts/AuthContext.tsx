"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import type { User, UserRole } from "@/types";
import { authService } from "@/services/authService";
import { usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = "auth_user";

const KEYCLOAK_ROLE_MAP: Record<string, UserRole> = {
  ADMIN: "Admin",
  REPORTER: "Reporter",
  "EMERGENCY-SERVICE": "Emergency Service",
};

const mapRoles = (rawRoles: string[]): UserRole[] => {
  const mapped = rawRoles
    .map((r) => KEYCLOAK_ROLE_MAP[r])
    .filter((r): r is UserRole => r !== undefined);
  return mapped.length > 0 ? mapped : ["User"];
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const pathName = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authenticated = await authService.initKeycloak();

        if (authenticated) {
          const userInfo = await authService.getUserInfo();
          if (userInfo) {
            const mappedUser = {
              id: userInfo.sub,
              username: userInfo.preferred_username || userInfo.name || "",
              email: userInfo.email || "",
              role: mapRoles(authService.getUserRoles()),
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

    if(pathName !== "/login" && pathName !== "/") {
      initAuth();
    }
  }, [pathName]);

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
