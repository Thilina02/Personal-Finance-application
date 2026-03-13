"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  initialized: boolean;
  login: (data: { token: string; user: User }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = window.localStorage.getItem("pf_token");
    const storedUser = window.localStorage.getItem("pf_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        window.localStorage.removeItem("pf_token");
        window.localStorage.removeItem("pf_user");
      }
    }
    setInitialized(true);
  }, []);

  const login = (data: { token: string; user: User }) => {
    setToken(data.token);
    setUser(data.user);
    setInitialized(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("pf_token", data.token);
      window.localStorage.setItem("pf_user", JSON.stringify(data.user));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setInitialized(true);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("pf_token");
      window.localStorage.removeItem("pf_user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, initialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

