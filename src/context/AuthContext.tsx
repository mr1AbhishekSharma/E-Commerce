"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { loginUser, registerUser, getCurrentUser } from "@/lib/api";

export interface LoginResult {
  success: boolean;
  error?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  email?: string;
  user?: User;
}

export interface RegisterResult {
  success: boolean;
  error?: string;
  requiresVerification?: boolean;
  email?: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<LoginResult>;
  register: (username: string, email: string, password: string) => Promise<RegisterResult>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const savedToken = localStorage.getItem("vibe_token");
        if (savedToken) {
          setToken(savedToken);
          const userData = await getCurrentUser(savedToken);
          if (userData) {
            setUser(userData);
          } else {
            localStorage.removeItem("vibe_token");
            localStorage.removeItem("vibe_refresh");
            setToken(null);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (
    emailOrUsername: string,
    password: string
  ): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const res = await loginUser(emailOrUsername, password);
      if (res.error || !res.access) {
        setIsLoading(false);
        return {
          success: false,
          error: res.error || "Login failed",
          isVerified: res.is_verified,
          isAdmin: res.is_admin,
          email: res.email,
        };
      }

      localStorage.setItem("vibe_token", res.access);
      if (res.refresh) localStorage.setItem("vibe_refresh", res.refresh);
      setToken(res.access);

      const userData = await getCurrentUser(res.access);
      const isUserAdmin = Boolean(
        userData?.is_staff || userData?.is_superuser || res.user?.is_staff || res.user?.is_superuser || res.is_admin
      );

      if (userData) {
        setUser(userData);
      } else {
        setUser(res.user || {
          id: 0,
          username: emailOrUsername,
          email: emailOrUsername.includes("@") ? emailOrUsername : "",
          is_staff: isUserAdmin,
          is_superuser: isUserAdmin,
        });
      }

      setIsLoading(false);
      return { success: true, isVerified: true, isAdmin: isUserAdmin, user: userData || res.user };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "An unexpected error occurred" };
    }
  };

  const register = async (username: string, email: string, password: string): Promise<RegisterResult> => {
    setIsLoading(true);
    try {
      const res = await registerUser(username, email, password);
      if (res.error) {
        setIsLoading(false);
        return { success: false, error: res.error };
      }

      if (res.requires_verification) {
        setIsLoading(false);
        return {
          success: true,
          requiresVerification: true,
          email: email,
          message: res.message || "Verification email sent. Please check your inbox.",
        };
      }

      if (res.access) {
        localStorage.setItem("vibe_token", res.access);
        if (res.refresh) localStorage.setItem("vibe_refresh", res.refresh);
        setToken(res.access);
        if (res.user) {
          setUser(res.user);
        } else {
          const userData = await getCurrentUser(res.access);
          setUser(userData || { id: 0, username, email });
        }
      } else {
        return await login(username, password);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Registration failed" };
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const userData = await getCurrentUser(token);
      if (userData) {
        setUser(userData);
      }
    } catch (e) {
      console.error("Failed to refresh user:", e);
    }
  };

  const logout = () => {
    localStorage.removeItem("vibe_token");
    localStorage.removeItem("vibe_refresh");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
