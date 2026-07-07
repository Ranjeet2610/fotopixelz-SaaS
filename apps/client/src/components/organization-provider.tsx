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
import { apiRequest, getStoredOrganization, saveOrganization } from "@/lib/api-client";
import { isClientRole } from "@/lib/access-control";
import { normalizeWorkspaceOrganization } from "@/lib/workspace";
import type { WorkspaceOrganization } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";

type OrganizationContextValue = {
  organization: WorkspaceOrganization | null;
  loading: boolean;
  refreshOrganization: () => Promise<WorkspaceOrganization | null>;
  setOrganization: (organization: WorkspaceOrganization | null) => void;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, token, loading: authLoading } = useAuth();
  const [organization, setOrganizationState] = useState<WorkspaceOrganization | null>(null);
  const [loading, setLoading] = useState(true);

  const setOrganization = useCallback((nextOrganization: WorkspaceOrganization | null) => {
    setOrganizationState(nextOrganization);
    if (nextOrganization) {
      saveOrganization(nextOrganization);
    }
  }, []);

  const refreshOrganization = useCallback(async () => {
    const activeToken = token;
    if (!activeToken || !user || !isClientRole(user.role)) {
      setOrganizationState(null);
      return null;
    }

    const organizations = await apiRequest<unknown[]>("/organizations", { token: activeToken });
    const first = Array.isArray(organizations)
      ? normalizeWorkspaceOrganization(organizations[0])
      : null;

    setOrganization(first);
    return first;
  }, [token, user, setOrganization]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !isClientRole(user.role)) {
      setOrganizationState(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const storedOrganization = getStoredOrganization();
    if (storedOrganization && !cancelled) {
      setOrganizationState(storedOrganization);
    }

    async function load() {
      setLoading(true);
      try {
        await refreshOrganization();
      } catch {
        if (!cancelled && !storedOrganization) {
          setOrganizationState(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, refreshOrganization]);

  const value = useMemo(
    () => ({
      organization,
      loading,
      refreshOrganization,
      setOrganization,
    }),
    [organization, loading, refreshOrganization, setOrganization],
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const value = useContext(OrganizationContext);
  if (!value) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return value;
}
