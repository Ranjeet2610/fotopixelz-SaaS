"use client";

import Link from "next/link";
import { LoadingBlock } from "@/components/loading-block";
import { Button } from "@/components/ui/button";
import type { CatalogAddon } from "@/lib/catalog-types";
import type { CategoryWithServices } from "@/lib/service-catalog";
import { formatServicePrice, resolveCategoryForRoute, useCatalogData } from "@/lib/service-catalog";
import { AddonList } from "./addon-list";
import { HowItWorks } from "./how-it-works";
import { MarketingCTA } from "./marketing-cta";
import { MarketingHeader } from "./marketing-header";
import { MarketingHero } from "./marketing-hero";
import { ServicePriceList } from "./service-price-list";

export function ServiceDetail({ routeSlug }: { routeSlug: string }) {
  const state = useCatalogData();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MarketingHeader />

      {state.status === "loading" ? (
        <LoadingBlock label="Loading service details..." />
      ) : state.status === "error" ? (
        <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-24 text-center">
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        </div>
      ) : (
        <ServiceDetailBody routeSlug={routeSlug} categories={state.data.categories} addons={state.data.addons} />
      )}
    </div>
  );
}

function ServiceDetailBody({
  routeSlug,
  categories,
  addons,
}: {
  routeSlug: string;
  categories: CategoryWithServices[];
  addons: CatalogAddon[];
}) {
  const category = resolveCategoryForRoute(routeSlug, categories);

  if (!category) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Service coming soon</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This service isn&apos;t available in the catalog yet. Check back soon or explore our other services.
        </p>
        <Button asChild className="mt-6">
          <Link href="/services">Browse services</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <MarketingHero
        eyebrow="Service"
        title={category.name}
        description={category.description ?? "Professional editing for your product and fashion imagery."}
        actions={
          <>
            <Button asChild size="lg">
              <Link href={`/dashboard/orders/new?categoryId=${category.id}`}>Start an order</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">View all pricing</Link>
            </Button>
          </>
        }
      />

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-medium">Services in this category</h2>
          <span className="text-sm text-muted-foreground">{formatServicePrice(category.startingPrice)}</span>
        </div>
        <ServicePriceList services={category.services} />
      </section>

      {addons.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-6 pb-16">
          <h2 className="mb-4 text-lg font-medium">Available addons</h2>
          <AddonList addons={addons} />
        </section>
      ) : null}

      <HowItWorks />

      <MarketingCTA
        title={`Ready to start your ${category.name.toLowerCase()} order?`}
        description="Create your order, upload your images, and our production team will take it from there."
        href={`/dashboard/orders/new?categoryId=${category.id}`}
        label="Start an order"
      />
    </>
  );
}
