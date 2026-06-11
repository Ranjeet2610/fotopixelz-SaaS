"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  canAccessDashboardPath,
  getClientNavItems,
  isClientRole,
} from "@/lib/access-control";
import { useAuth } from "@/components/auth-provider";
import { useOrganization } from "@/components/organization-provider";
import { LoadingBlock } from "@/components/loading-block";
import { Button } from "@/components/ui/button";
import { isDemoTrialAccount } from "@/lib/workspace";

export function ClientShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { organization } = useOrganization();
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

    if (!isClientRole(user.role)) {
      void logout().finally(() => router.replace("/login?staff=blocked"));
      return;
    }

    if (!canAccessDashboardPath(pathname)) {
      router.replace("/dashboard");
    }
  }, [loading, user, pathname, searchParams, router, logout]);

  const navItems = useMemo(() => getClientNavItems(), []);
  const allowed = Boolean(user && isClientRole(user.role) && canAccessDashboardPath(pathname));

  if (loading || !allowed || !user) {
    return <LoadingBlock label="Checking workspace access..." />;
  }

  return (
    <div className="flex min-h-full flex-1">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-background p-4 transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 space-y-1">
          <p className="text-sm font-semibold tracking-tight">fotopixelz</p>
          <p className="text-xs text-muted-foreground">Client workspace</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Client navigation">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="flex min-h-full flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              className="lg:hidden"
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
            >
              Menu
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">Client dashboard</p>
                {isDemoTrialAccount(organization) ? (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-200">
                    Demo
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user.name ?? user.email}</p>
              <p className="text-xs text-muted-foreground">Client</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => {
                void logout().finally(() => router.replace("/login"));
              }}
            >
              Sign out
            </Button>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-6">{children}</div>
      </div>
    </div>
  );
}
