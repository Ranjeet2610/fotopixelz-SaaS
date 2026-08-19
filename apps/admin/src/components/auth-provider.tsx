"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiRequest,
  clearSessionStorage,
  getStoredToken,
  getStoredUser,
  saveSession,
  saveUser,
} from "@/lib/api-client";
import { normalizeRole } from "@/lib/access-control";
import type { SessionUser } from "@/lib/types";

type AuthContextValue = {
  user: SessionUser | null;
  token: string | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<SessionUser | null>;
  updateLocalUser: (user: SessionUser) => void;
};

type AuthResponse = {
  token?: string;
  accessToken?: string;
  user?: SessionUser;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const activeToken = token ?? getStoredToken();
    if (!activeToken) {
      return null;
    }

    const currentUser = await apiRequest<SessionUser>("/auth/me", { token: activeToken });
    const normalizedRole = normalizeRole(currentUser.role);
    if (!normalizedRole) {
      throw new Error("Unknown user role");
    }

    const nextUser = { ...currentUser, role: normalizedRole };
    setUser(nextUser);
    saveUser(nextUser);
    return nextUser;
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (!storedToken) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setToken(storedToken);
        setUser(storedUser);
      }

      try {
        const currentUser = await apiRequest<SessionUser>("/auth/me", { token: storedToken });
        const normalizedRole = normalizeRole(currentUser.role);
        if (!normalizedRole) {
          throw new Error("Unknown user role");
        }

        const nextUser = { ...currentUser, role: normalizedRole };
        if (!cancelled) {
          setUser(nextUser);
          saveUser(nextUser);
        }
      } catch {
        clearSessionStorage();
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const result = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: input,
    });

    const issuedToken = result.token ?? result.accessToken;
    if (!issuedToken) {
      throw new Error("Login response did not include an access token");
    }

    let currentUser = result.user;
    if (!currentUser) {
      currentUser = await apiRequest<SessionUser>("/auth/me", { token: issuedToken });
    }

    const normalizedRole = normalizeRole(currentUser.role);
    if (!normalizedRole) {
      throw new Error("Unknown user role");
    }

    const nextUser = { ...currentUser, role: normalizedRole };
    setToken(issuedToken);
    setUser(nextUser);
    saveSession(issuedToken, nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    const activeToken = token ?? getStoredToken();
    try {
      if (activeToken) {
        await apiRequest("/auth/logout", { method: "POST", token: activeToken });
      }
    } catch {
      // Local session cleanup is still the source of truth for the admin UI.
    } finally {
      clearSessionStorage();
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const updateLocalUser = useCallback((nextUser: SessionUser) => {
    setUser(nextUser);
    saveUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, logout, refreshUser, updateLocalUser }),
    [user, token, loading, login, logout, refreshUser, updateLocalUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
