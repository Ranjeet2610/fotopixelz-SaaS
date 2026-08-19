"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeDollarSign,
  Images,
  LayoutGrid,
  Menu,
  Package,
  Plus,
  Settings as SettingsIcon,
  X,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

// "/dashboard" (Overview) must match exactly — every other dashboard route is
// nested under it, so a prefix match would mark Overview active everywhere.
function isNavItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const NAV_ICONS: Record<string, typeof LayoutGrid> = {
  Overview: LayoutGrid,
  Orders: Package,
  Assets: Images,
  Billing: BadgeDollarSign,
  Settings: SettingsIcon,
};

// Dark left-sidebar shell — the one deliberately dark surface in an
// otherwise light, professional production workspace (Pixelz-benchmark
// direction). Auth guard, canAccessDashboardPath redirect, route list, and
// logout logic are unchanged — only the chrome's visual structure changed.
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
  const settingsItem = useMemo(() => navItems.find((item) => item.label === "Settings"), [navItems]);

  const allowed = Boolean(user && isClientRole(user.role) && canAccessDashboardPath(pathname));

  if (loading || !allowed || !user) {
    return <LoadingBlock label="Checking workspace access..." />;
  }

  const handleSignOut = () => {
    void logout().finally(() => router.replace("/login"));
  };

  const initial = (user.name ?? user.email).charAt(0).toUpperCase();

  const navLink = (item: (typeof navItems)[number], onNavigate?: () => void) => {
    const active = isNavItemActive(pathname, item.href);
    const Icon = NAV_ICONS[item.label] ?? LayoutGrid;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors",
          active
            ? "bg-sidebar-active text-sidebar-foreground"
            : "text-sidebar-muted-foreground hover:bg-sidebar-active/60 hover:text-sidebar-foreground",
        )}
      >
        <Icon className="size-[17px] shrink-0" aria-hidden />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-5 pt-5 pb-4">
          <Link href="/dashboard" className="text-[13px] font-bold tracking-wide">
            FOTOPIXELZ
          </Link>
        </div>

        <div className="px-3">
          <Button
            asChild
            size="sm"
            className="bg-brand text-brand-foreground hover:bg-brand/90 w-full justify-start gap-1.5"
          >
            <Link href="/dashboard/orders/new">
              <Plus className="size-3.5" aria-hidden />
              New order
            </Link>
          </Button>
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-0.5 px-3" aria-label="Primary">
          {navItems.filter((item) => item.label !== "Settings").map((item) => navLink(item))}
        </nav>

        <div className="border-t border-sidebar-border px-3 py-3">
          {settingsItem ? navLink(settingsItem) : null}

          <div className="relative mt-1">
            <button
              type="button"
              onClick={() => setAccountMenuOpen((value) => !value)}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left hover:bg-sidebar-active/60"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-[11px] font-semibold">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-sidebar-foreground">
                  {organization?.name ?? "Workspace"}
                </p>
                {isDemoTrialAccount(organization) ? (
                  <p className="text-[10px] font-semibold tracking-wide text-amber-400 uppercase">Demo</p>
                ) : (
                  <p className="truncate text-[11px] text-sidebar-muted-foreground">{user.email}</p>
                )}
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
                <div className="absolute bottom-full left-0 z-40 mb-2 w-full rounded-lg border border-border bg-card p-1.5 text-card-foreground shadow-lg">
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
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setMenuOpen(true)}
          className="rounded-md p-1.5 hover:bg-sidebar-active/60"
        >
          <Menu className="size-5" aria-hidden />
        </button>
        <Link href="/dashboard" className="text-[13px] font-bold tracking-wide">
          FOTOPIXELZ
        </Link>
        <Button
          asChild
          size="icon-sm"
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          aria-label="New order"
        >
          <Link href="/dashboard/orders/new">
            <Plus className="size-4" aria-hidden />
          </Link>
        </Button>
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
          <div className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col gap-1 bg-sidebar p-4 text-sidebar-foreground md:hidden">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-bold tracking-wide">FOTOPIXELZ</p>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMenuOpen(false)}
                className="rounded-md p-1 hover:bg-sidebar-active/60"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            {navItems.map((item) => navLink(item, () => setMenuOpen(false)))}
            <div className="my-2 border-t border-sidebar-border" />
            <div className="px-3 py-1">
              <p className="text-sm font-medium">{user.name ?? user.email}</p>
              <p className="text-xs text-sidebar-muted-foreground">{organization?.name}</p>
            </div>
            <Button size="sm" variant="outline" type="button" onClick={handleSignOut} className="mt-2">
              Sign out
            </Button>
          </div>
        </>
      ) : null}

      <div className="flex-1 bg-background p-4 lg:p-8">{children}</div>
    </div>
  );
}
