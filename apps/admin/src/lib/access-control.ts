import type { Role } from "./types";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

const internalRoles: Role[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "QA"];
const managementRoles: Role[] = ["SUPER_ADMIN", "ADMIN"];

const dashboard: NavItem = { label: "Dashboard", href: "/admin", icon: "D" };
const orders: NavItem = { label: "Orders", href: "/admin/orders", icon: "O" };
const assignedOrders: NavItem = {
  label: "Assigned Orders",
  href: "/admin/orders?scope=editor",
  icon: "AO",
};
const qaQueue: NavItem = { label: "QA Queue", href: "/admin/qa", icon: "Q" };
const uploads: NavItem = { label: "Uploads", href: "/admin/uploads", icon: "U" };
const assets: NavItem = { label: "Assets", href: "/admin/assets", icon: "A" };
const profile: NavItem = { label: "Profile", href: "/admin/profile", icon: "P" };

export function normalizeRole(role?: string | null): Role | null {
  if (!role) {
    return null;
  }
  return ["SUPER_ADMIN", "ADMIN", "EDITOR", "QA", "CLIENT"].includes(role) ? (role as Role) : null;
}

export function isInternalRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return normalized ? internalRoles.includes(normalized) : false;
}

export function isManagementRole(role?: string | null) {
  const normalized = normalizeRole(role);
  return normalized ? managementRoles.includes(normalized) : false;
}

export function getAdminNavGroups(role?: string | null): NavGroup[] {
  const normalized = normalizeRole(role);

  if (normalized === "SUPER_ADMIN" || normalized === "ADMIN") {
    return [
      { label: "Operations", items: [dashboard, orders, uploads, assets] },
      {
        label: "People",
        items: [
          { label: "Users", href: "/admin/users", icon: "US" },
          { label: "Clients", href: "/admin/clients", icon: "CL" },
          { label: "Editors", href: "/admin/editors", icon: "ED" },
          { label: "QA", href: "/admin/qa", icon: "QA" },
        ],
      },
      {
        label: "Configuration",
        items: [
          { label: "Organizations", href: "/admin/organizations", icon: "OR" },
          { label: "Categories", href: "/admin/categories", icon: "CA" },
          { label: "Addons", href: "/admin/addons", icon: "AD" },
          { label: "Settings", href: "/admin/settings", icon: "SE" },
        ],
      },
    ];
  }

  if (normalized === "EDITOR") {
    return [
      { label: "Work", items: [dashboard, assignedOrders, uploads, assets, profile] },
    ];
  }

  if (normalized === "QA") {
    return [{ label: "Quality", items: [dashboard, qaQueue, orders, assets, profile] }];
  }

  return [];
}

export function defaultRouteForRole(role?: string | null) {
  const normalized = normalizeRole(role);
  if (normalized === "CLIENT") {
    return "/login?client=blocked";
  }

  if (isInternalRole(normalized)) {
    return "/admin";
  }

  return "/login";
}

export function canAccessAdminPath(role: string | null | undefined, pathname: string) {
  const normalized = normalizeRole(role);

  if (!normalized || normalized === "CLIENT") {
    return false;
  }

  if (normalized === "SUPER_ADMIN" || normalized === "ADMIN") {
    return matches(pathname, [
      "/admin",
      "/admin/orders",
      "/admin/uploads",
      "/admin/assets",
      "/admin/users",
      "/admin/clients",
      "/admin/editors",
      "/admin/qa",
      "/admin/organizations",
      "/admin/categories",
      "/admin/addons",
      "/admin/settings",
      "/admin/profile",
    ]);
  }

  if (normalized === "EDITOR") {
    return matches(pathname, ["/admin", "/admin/orders", "/admin/uploads", "/admin/assets", "/admin/profile"]);
  }

  if (normalized === "QA") {
    return matches(pathname, ["/admin", "/admin/qa", "/admin/orders", "/admin/assets", "/admin/profile"]);
  }

  return false;
}

export function routeAfterAuth(role: string | null | undefined, next?: string | null) {
  const normalized = normalizeRole(role);
  if (normalized && next?.startsWith("/admin") && canAccessAdminPath(normalized, next)) {
    return next;
  }
  return defaultRouteForRole(normalized);
}

function matches(pathname: string, allowed: string[]) {
  return allowed.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
