"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { DemoAccountBanner } from "@/components/demo-account-banner";
import { useOrganization } from "@/components/organization-provider";
import { AccountStat } from "@/components/dashboard/account-stat";
import {
  FilmstripSkeleton,
  HeroSkeleton,
  OrderLogSkeleton,
  ProofSheetSkeleton,
} from "@/components/dashboard/dashboard-skeleton";
import { HeroProductionCard } from "@/components/dashboard/hero-production-card";
import { OrderLog } from "@/components/dashboard/order-log";
import { ProductionCard } from "@/components/dashboard/production-card";
import { ProofSheet } from "@/components/dashboard/proof-sheet";
import { SectionAlert } from "@/components/dashboard/section-alert";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/lib/dashboard-data";
import { getClientOrderStatusLabel } from "@/lib/order-status";
import { getCreditsRemaining, getTrialDaysRemaining, isDemoTrialAccount } from "@/lib/workspace";

export default function Page() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const isDemo = isDemoTrialAccount(organization);
  const trialDaysRemaining = getTrialDaysRemaining(organization?.trialEndsAt);
  const creditsRemaining = getCreditsRemaining(organization);

  const { orders, assets, hero, heroUpload, upNext, filmstrip, proofSheetAssets, proofSheetMoreCount, log } =
    useDashboardData(organization?.id);

  const hasAnyOrders = orders.data.length > 0;

  return (
    <div className="space-y-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Production overview
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-[26px]">
            {user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Welcome back"}
          </h1>
        </div>
        <div className="flex items-baseline gap-8">
          <AccountStat value={creditsRemaining} unit={`/ ${organization?.freeImageCredits ?? 0}`} label="Credits" />
          {isDemo ? <AccountStat value={trialDaysRemaining} unit="days" label="Trial remaining" /> : null}
        </div>
      </div>

      <DemoAccountBanner />

      {orders.error ? <SectionAlert message={orders.error} /> : null}

      {orders.loading ? (
        <HeroSkeleton />
      ) : !hasAnyOrders ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-base font-medium">Start your first order</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Choose a service and upload your images to begin production.
          </p>
          <Button asChild className="bg-coral text-coral-foreground hover:bg-coral/90 mt-5">
            <Link href="/dashboard/orders/new">Start an order</Link>
          </Button>
        </div>
      ) : hero ? (
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <HeroProductionCard
            orderId={hero.id}
            orderNumber={hero.orderNumber}
            title={hero.title}
            status={hero.status}
            meta={
              hero.status === "UPLOADED" || hero.status === "SUBMITTED"
                ? `${hero.totalImages} expected images`
                : getClientOrderStatusLabel(hero.status)
            }
            upload={heroUpload}
            ctaLabel={hero.status === "SUBMITTED" || hero.status === "DRAFT" ? "Continue upload" : "View order"}
          />
          {upNext.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Up next</p>
              {upNext.map((order) => (
                <ProductionCard
                  key={order.id}
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  title={order.title}
                  status={order.status}
                  meta={`${order.totalImages} images`}
                  showStageTrack={false}
                  orientation="horizontal"
                  className="h-[92px]"
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {orders.loading ? (
        <FilmstripSkeleton />
      ) : filmstrip.length > 0 ? (
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[15.5px] font-semibold">In production</h2>
            <Link href="/dashboard/orders" className="text-[12.5px] text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {filmstrip.map((order) => (
              <ProductionCard
                key={order.id}
                orderId={order.id}
                orderNumber={order.orderNumber}
                title={order.title}
                status={order.status}
                meta={`${order.totalImages} images`}
              />
            ))}
          </div>
        </section>
      ) : null}

      {assets.error ? <SectionAlert message={assets.error} /> : null}

      {assets.loading ? (
        <ProofSheetSkeleton />
      ) : proofSheetAssets.length > 0 ? (
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[15.5px] font-semibold">Ready to download</h2>
            <Link href="/dashboard/assets" className="text-[12.5px] text-primary hover:underline">
              Open assets →
            </Link>
          </div>
          <ProofSheet assets={proofSheetAssets} moreCount={proofSheetMoreCount} />
        </section>
      ) : null}

      {orders.loading ? (
        <OrderLogSkeleton />
      ) : log.length > 0 ? (
        <section>
          <p className="mb-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">Order log</p>
          <OrderLog orders={log} />
        </section>
      ) : null}
    </div>
  );
}
