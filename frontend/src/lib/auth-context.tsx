"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, User } from "./api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on client mount
  useEffect(() => {
    const savedUser = api.getUser();
    const token = api.getAccessToken();

    if (savedUser && token) {
      setUser(savedUser);
      // Preemptively ensure valid token
      api.ensureValidToken().catch(() => {
        setUser(null);
      });
    }
    setIsLoading(false);
  }, []);

  // Background token refresh every 10 minutes (token expires in 15 mins)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      api.ensureValidToken().catch((err) => {
        console.warn("Background token refresh failed:", err);
      });
    }, 10 * 60 * 1000); // every 10 minutes

    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
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
