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
  saveOrganization,
  saveSession,
  saveUser,
} from "@/lib/api-client";
import { normalizeRole } from "@/lib/access-control";
import { normalizeWorkspaceOrganization } from "@/lib/workspace";
import type { SessionUser, WorkspaceOrganization } from "@/lib/types";

type AuthContextValue = {
  user: SessionUser | null;
  token: string | null;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<SessionUser>;
  register: (input: {
    name?: string;
    email: string;
    password: string;
    organizationName?: string;
  }) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<SessionUser | null>;
};

type AuthResponse = {
  token?: string;
  accessToken?: string;
  user?: SessionUser;
  organization?: WorkspaceOrganization;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function applyAuthResponse(result: AuthResponse) {
  const issuedToken = result.token ?? result.accessToken;
  if (!issuedToken) {
    throw new Error("Authentication response did not include an access token");
  }

  return { issuedToken, user: result.user };
}

async function resolveSessionUser(issuedToken: string, user?: SessionUser) {
  let currentUser = user;
  if (!currentUser) {
    currentUser = await apiRequest<SessionUser>("/auth/me", { token: issuedToken });
  }

  const normalizedRole = normalizeRole(currentUser.role);
  if (!normalizedRole) {
    throw new Error("Unknown user role");
  }

  return { ...currentUser, role: normalizedRole };
}

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

  const establishSession = useCallback(async (result: AuthResponse) => {
    const { issuedToken, user: responseUser } = applyAuthResponse(result);
    const nextUser = await resolveSessionUser(issuedToken, responseUser);
    const organization = normalizeWorkspaceOrganization(result.organization);
    setToken(issuedToken);
    setUser(nextUser);
    saveSession(issuedToken, nextUser, organization);
    if (organization) {
      saveOrganization(organization);
    }
    return nextUser;
  }, []);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const result = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: input,
      });
      return establishSession(result);
    },
    [establishSession],
  );

  const register = useCallback(
    async (input: {
      name?: string;
      email: string;
      password: string;
      organizationName?: string;
    }) => {
      const result = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: input,
      });
      return establishSession(result);
    },
    [establishSession],
  );

  const logout = useCallback(async () => {
    const activeToken = token ?? getStoredToken();
    try {
      if (activeToken) {
        await apiRequest("/auth/logout", { method: "POST", token: activeToken });
      }
    } catch {
      // Local session cleanup is still the source of truth for the web UI.
    } finally {
      clearSessionStorage();
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshUser }),
    [user, token, loading, login, register, logout, refreshUser],
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
