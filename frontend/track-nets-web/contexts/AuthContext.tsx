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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          const token = authService.getAccessToken();
          if (token) {
            try {
              const userInfo = await authService.getUserInfo();
              if (userInfo) {
                setUser({
                  ...parsedUser,
                  email: userInfo.email || parsedUser.email,
                });
              }
            } catch {
              console.warn("Could not refresh user info");
            }
          }
        }
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
