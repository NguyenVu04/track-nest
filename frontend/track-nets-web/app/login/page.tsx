"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User as UserIcon, Shield, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService, UserRole } from "@/services/authService";
import { toast } from "sonner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginRole, setLoginRole] = useState<UserRole>("user");
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard/missing-persons");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authService.login(
        { username, password },
        loginRole
      );

      const mockUser = {
        id: response.access_token.substring(0, 8),
        username,
        password,
        email: `${username}@track.com`,
        role: loginRole === "user" ? "User" : 
              loginRole === "reporter" ? "Reporter" : 
              loginRole === "emergency_services" ? "Emergency Services" : "Admin",
        fullName: username,
      };

      login(mockUser);
      toast.success(`Welcome, ${username}!`);
      router.push("/dashboard/missing-persons");
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage || "Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const credentials = {
        user: { username: "user", password: "user" },
        reporter: { username: "reporter", password: "reporter" },
        emergency_services: { username: "emergency", password: "emergency" },
        admin: { username: "admin", password: "admin" },
      };

      const { username: demoUser, password: demoPass } = credentials[role];
      
      await authService.login({ username: demoUser, password: demoPass }, role);

      const mockUser = {
        id: "demo-" + role,
        username: demoUser,
        password: demoPass,
        email: `${demoUser}@track.com`,
        role: role === "user" ? "User" : 
              role === "reporter" ? "Reporter" : 
              role === "emergency_services" ? "Emergency Services" : "Admin",
        fullName: demoUser.charAt(0).toUpperCase() + demoUser.slice(1) + " User",
      };

      login(mockUser);
      toast.success(`Welcome, ${mockUser.fullName}!`);
      router.push("/dashboard/missing-persons");
    } catch (err) {
      console.error("Demo login error:", err);
      setError("Demo login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-indigo-900 mb-2 text-2xl font-bold">
            TRACK Nest
          </h1>
          <p className="text-gray-600">Sign in to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Login as</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLoginRole("user")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  loginRole === "user"
                    ? "bg-indigo-100 border-indigo-500 text-indigo-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                User
              </button>
              <button
                type="button"
                onClick={() => setLoginRole("reporter")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  loginRole === "reporter"
                    ? "bg-indigo-100 border-indigo-500 text-indigo-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Reporter
              </button>
              <button
                type="button"
                onClick={() => setLoginRole("emergency_services")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  loginRole === "emergency_services"
                    ? "bg-indigo-100 border-indigo-500 text-indigo-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Emergency
              </button>
              <button
                type="button"
                onClick={() => setLoginRole("admin")}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  loginRole === "admin"
                    ? "bg-indigo-100 border-indigo-500 text-indigo-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-gray-600 text-sm mb-3">Quick Demo Login:</p>
          <div className="space-y-2">
            <button
              onClick={() => handleDemoLogin("user")}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <UserIcon className="w-4 h-4" />
              Login as User
            </button>
            <button
              onClick={() => handleDemoLogin("reporter")}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              <Shield className="w-4 h-4" />
              Login as Reporter
            </button>
            <button
              onClick={() => handleDemoLogin("emergency_services")}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              Login as Emergency Services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
