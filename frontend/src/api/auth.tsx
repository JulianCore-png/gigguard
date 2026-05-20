import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./client";

export type User = { id: string; email: string; is_pro: boolean; created_at: string };

type Ctx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = (await api.get("/auth/me")) as User;
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const t = await api.getToken();
      if (t) await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const r = (await api.post("/auth/login", { email, password })) as { access_token: string };
    await api.setToken(r.access_token);
    await refresh();
  };

  const register = async (email: string, password: string) => {
    const r = (await api.post("/auth/register", { email, password })) as { access_token: string };
    await api.setToken(r.access_token);
    await refresh();
  };

  const logout = async () => {
    await api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
