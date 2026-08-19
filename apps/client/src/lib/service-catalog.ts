"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "./api-client";
import type { CatalogAddon, CatalogService, Paginated, ServiceCategory } from "./catalog-types";

export type CategoryWithServices = ServiceCategory & {
  services: CatalogService[];
  startingPrice: number | null;
};

export type CatalogData = {
  categories: CategoryWithServices[];
  addons: CatalogAddon[];
};

type CatalogState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CatalogData };

/**
 * Route slugs are fixed marketing routes under /services/*. Database category
 * slugs are managed independently (via admin/seed) and are not guaranteed to
 * match 1:1, so each route maps to the category slug(s) it should resolve to.
 */
const ROUTE_CATEGORY_SLUGS: Record<string, string[]> = {
  "ai-backgrounds": ["ai-backgrounds", "ai-background-generation"],
  "background-removal": ["background-removal"],
  "clipping-path": ["clipping-path"],
  "color-correction": ["color-correction"],
  "ghost-mannequin": ["ghost-mannequin"],
  retouching: ["fashion-retouching", "retouching", "jewelry-retouching"],
  "shadow-creation": ["shadow-creation"],
};

export function useCatalogData(): CatalogState {
  const [state, setState] = useState<CatalogState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });
      try {
        const [categoriesRes, servicesRes, addonsRes] = await Promise.all([
          apiRequest<Paginated<ServiceCategory>>("/categories", { query: { limit: 100 } }),
          apiRequest<Paginated<CatalogService>>("/services", { query: { limit: 100 } }),
          apiRequest<Paginated<CatalogAddon>>("/addons", { query: { limit: 100 } }),
        ]);

        if (cancelled) {
          return;
        }

        const services = servicesRes.items ?? [];
        const categories: CategoryWithServices[] = (categoriesRes.items ?? []).map((category) => {
          const categoryServices = services.filter((service) => service.categoryId === category.id);
          const prices = categoryServices
            .map((service) => service.basePrice)
            .filter((price) => Number.isFinite(price));

          return {
            ...category,
            services: categoryServices,
            startingPrice: prices.length > 0 ? Math.min(...prices) : null,
          };
        });

        setState({ status: "ready", data: { categories, addons: addonsRes.items ?? [] } });
      } catch (caught) {
        if (!cancelled) {
          setState({
            status: "error",
            message: caught instanceof Error ? caught.message : "Failed to load service catalog",
          });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function resolveCategoryForRoute(routeSlug: string, categories: CategoryWithServices[]) {
  const candidates = ROUTE_CATEGORY_SLUGS[routeSlug] ?? [routeSlug];
  return categories.find((category) => candidates.includes(category.slug));
}

export function routeSlugForCategory(category: Pick<ServiceCategory, "slug">): string | null {
  const entry = Object.entries(ROUTE_CATEGORY_SLUGS).find(([, slugs]) => slugs.includes(category.slug));
  return entry ? `/services/${entry[0]}` : null;
}

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatServicePrice(amount: number | null, currency = "USD") {
  if (amount === null) {
    return "Pricing available on request";
  }
  return `From ${formatMoney(amount, currency)} / image`;
}
