"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, unwrap } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (values: { name: string; email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("accessToken");
    try {
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedToken) setAccessToken(savedToken);
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
    setReady(true);
  }, []);

  function store(payload: { accessToken: string; refreshToken: string; user: User }) {
    localStorage.setItem("accessToken", payload.accessToken);
    localStorage.setItem("refreshToken", payload.refreshToken);
    localStorage.setItem("user", JSON.stringify(payload.user));
    setAccessToken(payload.accessToken);
    setUser(payload.user);
    return payload.user;
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      accessToken,
      login: async (email, password) => store(unwrap(await api.post("/api/auth/login", { email, password }))),
      register: async (values) => store(unwrap(await api.post("/api/auth/register", values))),
      logout: async () => {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) await api.post("/api/auth/logout", { refreshToken }).catch(() => undefined);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
        setAccessToken(null);
        router.push("/login");
      }
    }),
    [accessToken, ready, router, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
