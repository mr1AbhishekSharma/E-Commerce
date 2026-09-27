"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { loginUser, registerUser, getCurrentUser } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginUser(username, password);
      if (res.error || !res.access) {
        setIsLoading(false);
        return { success: false, error: res.error || "Login failed" };
      }

      localStorage.setItem("vibe_token", res.access);
      if (res.refresh) localStorage.setItem("vibe_refresh", res.refresh);
      setToken(res.access);

      const userData = await getCurrentUser(res.access);
      if (userData) {
        setUser(userData);
      } else {
        setUser({ id: 0, username, email: "" });
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "An unexpected error occurred" };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await registerUser(username, email, password);
      if (res.error) {
        setIsLoading(false);
        return { success: false, error: res.error };
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

  const logout = () => {
    localStorage.removeItem("vibe_token");
    localStorage.removeItem("vibe_refresh");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
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
