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

// "/dashboard" (Overview) must match exactly — every other dashboard route is
// nested under it, so a prefix match would mark Overview active everywhere.
function isNavItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Direction D top-bar navigation (docs/CLIENT-DASHBOARD.md's navigation
// resolution): persistent top bar + horizontal primary links + an avatar
// menu for account-level items, replacing the prior left sidebar. Auth
// guard, canAccessDashboardPath redirect, route list, and logout logic are
// unchanged from before — only the chrome's visual structure changed.
export function ClientShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { organization } = useOrganization();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
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

    if (!isClientRole(user.role)) {
      void logout().finally(() => router.replace("/login?staff=blocked"));
      return;
    }

    if (!canAccessDashboardPath(pathname)) {
      router.replace("/dashboard");
    }
  }, [loading, user, pathname, searchParams, router, logout]);

  const navItems = useMemo(() => getClientNavItems(), []);
  // Settings is account-level, not a production-workflow destination — same
  // route, presented in the avatar menu instead of the primary nav.
  const primaryNavItems = useMemo(() => navItems.filter((item) => item.label !== "Settings"), [navItems]);
  const settingsItem = useMemo(() => navItems.find((item) => item.label === "Settings"), [navItems]);

  const allowed = Boolean(user && isClientRole(user.role) && canAccessDashboardPath(pathname));

  if (loading || !allowed || !user) {
    return <LoadingBlock label="Checking workspace access..." />;
  }

  const handleSignOut = () => {
    void logout().finally(() => router.replace("/login"));
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border">
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-sm font-bold tracking-wide">
              FOTOPIXELZ
            </Link>

            <nav className="hidden items-center gap-6 text-[13.5px] text-muted-foreground md:flex" aria-label="Primary">
              {primaryNavItems.map((item) => {
                const active = isNavItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? "border-b-2 border-coral pb-[21px] -mb-[22px] font-semibold text-foreground"
                        : "hover:text-foreground"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild size="sm" className="bg-coral text-coral-foreground hover:bg-coral/90 hidden sm:inline-flex">
              <Link href="/dashboard/orders/new">New order</Link>
            </Button>
            <Button
              asChild
              size="icon-sm"
              className="bg-coral text-coral-foreground hover:bg-coral/90 sm:hidden"
              aria-label="New order"
            >
              <Link href="/dashboard/orders/new">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </Link>
            </Button>

            {/* Account menu (desktop + tablet) */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((value) => !value)}
                className="flex items-center gap-2.5 rounded-full py-1 pr-1 pl-2 hover:bg-muted/60"
              >
                <div className="text-right">
                  <p className="text-[12.5px] font-medium">{organization?.name ?? "Workspace"}</p>
                  {isDemoTrialAccount(organization) ? (
                    <p className="text-[10px] font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-300">
                      Demo
                    </p>
                  ) : null}
                </div>
                <div className="flex size-8 items-center justify-center rounded-full bg-foreground text-[11.5px] font-semibold text-background">
                  {(user.name ?? user.email).charAt(0).toUpperCase()}
                </div>
              </button>

              {accountMenuOpen ? (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <div className="absolute top-full right-0 z-40 mt-2 w-56 rounded-lg border border-border bg-background p-1.5 shadow-lg">
                    <div className="px-2.5 py-2">
                      <p className="text-sm font-medium">{user.name ?? user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="my-1 border-t border-border" />
                    {settingsItem ? (
                      <Link
                        href={settingsItem.href}
                        onClick={() => setAccountMenuOpen(false)}
                        className="block rounded-md px-2.5 py-2 text-sm hover:bg-muted"
                      >
                        Settings
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              ) : null}
            </div>

            <Button
              className="md:hidden"
              size="sm"
              variant="outline"
              type="button"
              aria-label="Open navigation"
              onClick={() => setMenuOpen((value) => !value)}
            >
              Menu
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {menuOpen ? (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col gap-1 border-r border-border bg-background p-4 md:hidden">
            <p className="mb-2 text-sm font-bold tracking-wide">FOTOPIXELZ</p>
            {navItems.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={
                    active
                      ? "rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground"
                      : "rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="my-2 border-t border-border" />
            <div className="px-3 py-1">
              <p className="text-sm font-medium">{user.name ?? user.email}</p>
              <p className="text-xs text-muted-foreground">{organization?.name}</p>
            </div>
            <Button size="sm" variant="outline" type="button" onClick={handleSignOut} className="mt-2">
              Sign out
            </Button>
          </div>
        </>
      ) : null}

      <div className="flex-1 p-4 lg:p-6">{children}</div>
    </div>
  );
}
