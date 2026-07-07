import type { Role } from "./types";

export type NavItem = {
  label: string;
  href: string;
};

const clientDashboardRoutes = [
  "/dashboard",
  "/dashboard/orders",
  "/dashboard/assets",
  "/dashboard/billing",
  "/dashboard/settings",
];

export function normalizeRole(role?: string | null): Role | null {
  if (!role) {
    return null;
  }
  return ["SUPER_ADMIN", "ADMIN", "EDITOR", "QA", "CLIENT"].includes(role) ? (role as Role) : null;
}

export function isClientRole(role?: string | null) {
  return normalizeRole(role) === "CLIENT";
}

export function getClientNavItems(): NavItem[] {
  return [
    { label: "Overview", href: "/dashboard" },
    { label: "Orders", href: "/dashboard/orders" },
    { label: "Assets", href: "/dashboard/assets" },
    { label: "Billing", href: "/dashboard/billing" },
    { label: "Settings", href: "/dashboard/settings" },
  ];
}

export function defaultRouteForRole(role?: string | null) {
  if (isClientRole(role)) {
    return "/dashboard";
  }
  return "/login?staff=blocked";
}

export function canAccessDashboardPath(pathname: string) {
  return clientDashboardRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function routeAfterAuth(role: string | null | undefined, next?: string | null) {
  const normalized = normalizeRole(role);
  if (normalized === "CLIENT" && next && canAccessDashboardPath(next)) {
    return next;
  }
  return defaultRouteForRole(normalized);
}
