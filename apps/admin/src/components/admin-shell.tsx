"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { canAccessAdminPath, getAdminNavGroups, isInternalRole } from "@/lib/access-control";
import { useAuth } from "./auth-provider";
import { Button, LoadingBlock } from "./ui";

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [railOpen, setRailOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      const next = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    if (user.role === "CLIENT") {
      void logout().finally(() => router.replace("/login?client=blocked"));
      return;
    }

    if (!canAccessAdminPath(user.role, pathname)) {
      router.replace("/admin");
    }
  }, [loading, user, pathname, searchParams, router, logout]);

  const navGroups = useMemo(() => getAdminNavGroups(user?.role), [user?.role]);
  const allowed = Boolean(user && isInternalRole(user.role) && canAccessAdminPath(user.role, pathname));

  const currentUser = user;

  if (loading || !allowed || !currentUser) {
    return (
      <main className="guard-screen">
        <LoadingBlock label="Checking admin access" />
      </main>
    );
  }

  return (
    <div className="admin-layout">
      <Button
        className="rail-mobile-toggle"
        size="sm"
        variant="secondary"
        onClick={() => setRailOpen((value) => !value)}
      >
        Menu
      </Button>

      <aside className={`admin-rail ${railOpen ? "is-open" : ""}`}>
        <div className="rail-brand" title="Fotopixelz Operations">
          fp
        </div>

        <nav className="rail-nav" aria-label="Operations navigation">
          {navGroups.map((group) => (
            <div className="rail-group" key={group.label}>
              {group.items.map((item) => {
                const itemPath = item.href.split("?")[0];
                const active = pathname === itemPath || pathname.startsWith(`${itemPath}/`);
                return (
                  <Link
                    className={`rail-item ${active ? "is-active" : ""}`}
                    href={item.href}
                    key={item.href}
                    title={item.label}
                    aria-label={item.label}
                    onClick={() => setRailOpen(false)}
                  >
                    <span aria-hidden>{item.icon}</span>
                    <span className="rail-mobile-labels">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="rail-account">
          <button
            type="button"
            className="rail-item"
            title={currentUser.name ?? currentUser.email}
            aria-label="Account menu"
            onClick={() => setAccountMenuOpen((value) => !value)}
          >
            {(currentUser.name ?? currentUser.email).slice(0, 1).toUpperCase()}
          </button>
          {accountMenuOpen ? (
            <div className="rail-account-menu">
              <strong>{currentUser.name ?? currentUser.email}</strong>
              <span>{currentUser.role}</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setAccountMenuOpen(false);
                  void logout();
                }}
              >
                Logout
              </Button>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="admin-main">
        <main className="content-shell">{children}</main>
      </div>
    </div>
  );
}
