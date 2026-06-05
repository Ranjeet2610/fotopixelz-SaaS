"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { API_BASE_URL } from "@/lib/api-client";
import { canAccessAdminPath, getAdminNavGroups, isInternalRole } from "@/lib/access-control";
import { useAuth } from "./auth-provider";
import { Button, LoadingBlock } from "./ui";

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">fotopixelz</span>
          <span>Operations</span>
        </div>
        <nav className="sidebar-nav" aria-label="Operations navigation">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => {
                const itemPath = item.href.split("?")[0];
                const active = pathname === itemPath || pathname.startsWith(`${itemPath}/`);
                return (
                  <Link
                    className={`nav-link ${active ? "is-active" : ""}`}
                    href={item.href}
                    key={item.href}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-support">
          <p>API</p>
          <span>{API_BASE_URL}</span>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <Button className="mobile-menu-btn" size="sm" variant="secondary" onClick={() => setSidebarOpen((value) => !value)}>
            Menu
          </Button>
          <div>
            <p>Operations Dashboard</p>
            <span>Live backend modules 1-8</span>
          </div>
          <div className="topbar-user">
            <div className="avatar">{(currentUser.name ?? currentUser.email).slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{currentUser.name ?? currentUser.email}</strong>
              <span>{currentUser.role}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={logout}>
              Logout
            </Button>
          </div>
        </header>
        <main className="content-shell">{children}</main>
      </div>
    </div>
  );
}
