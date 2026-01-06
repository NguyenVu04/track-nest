"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { User } from "@/types";
import { authService } from "@/services/authService";

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (userData: User) => {
    setUser(userData);
    // In production, you would also store the session/token

    try {
      const res = await authService.login({
        username: userData.username,
        password: userData.password,
      });

      console.log("Login successful", res);
    } catch (error) {
      // console.error("Login failed", error);
      // ignore error in this mock
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    // In production, you would also clear the session/token
  }, []);

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
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
