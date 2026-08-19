"use client";

import Link from "next/link";
import { LoadingBlock } from "@/components/loading-block";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { MarketingCTA } from "@/components/marketing/marketing-cta";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { ServiceGrid } from "@/components/marketing/service-grid";
import { Button } from "@/components/ui/button";
import { useCatalogData } from "@/lib/service-catalog";

export default function ServicesPage() {
  const state = useCatalogData();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MarketingHeader />

      <MarketingHero
        eyebrow="Services"
        title="Professional image editing, by category"
        description="Browse our editing services and see starting pricing for each category before you order."
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/pricing">View pricing</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">Get started</Link>
            </Button>
          </>
        }
      />

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        {state.status === "loading" ? (
          <LoadingBlock label="Loading services..." />
        ) : state.status === "error" ? (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        ) : (
          <ServiceGrid categories={state.data.categories} />
        )}
      </section>

      <HowItWorks />

      <MarketingCTA
        title="Not sure where to start?"
        description="Create a free account and our order wizard will guide you through choosing the right service."
        href="/register"
        label="Create your account"
      />
    </div>
  );
}
