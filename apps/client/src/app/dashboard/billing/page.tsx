"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useOrganization } from "@/components/organization-provider";
import { LoadingBlock } from "@/components/loading-block";
import { SectionAlert } from "@/components/dashboard/section-alert";
import { StatusChip } from "@/components/dashboard/status-chip";
import { ApiError, apiRequest } from "@/lib/api-client";
import type { CreatedOrder, Paginated } from "@/lib/catalog-types";
import { formatOrderDate, formatOrderNumber } from "@/lib/order-status";
import { getCreditsRemaining, getTrialDaysRemaining, isDemoTrialAccount } from "@/lib/workspace";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export default function BillingPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [orders, setOrders] = useState<CreatedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!organization?.id) {
      return;
    }

    setOrdersLoading(true);
    setError(null);
    try {
      const data = await apiRequest<Paginated<CreatedOrder>>("/orders", {
        query: { organizationId: organization.id, limit: 100 },
      });
      setOrders(
        (data.items ?? []).sort(
          (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : "Failed to load billing history",
      );
    } finally {
      setOrdersLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (orgLoading) {
      return;
    }

    if (!organization?.id) {
      setOrdersLoading(false);
      return;
    }

    void loadOrders();
  }, [loadOrders, orgLoading, organization?.id]);

  if (orgLoading || !organization) {
    return <LoadingBlock label="Loading billing..." />;
  }

  const remaining = getCreditsRemaining(organization);
  const isDemo = isDemoTrialAccount(organization);
  const trialDaysRemaining = getTrialDaysRemaining(organization.trialEndsAt);
  const creditUsagePercent =
    organization.freeImageCredits > 0
      ? Math.min(100, Math.round((organization.usedImageCredits / organization.freeImageCredits) * 100))
      : 0;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Account</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">Billing</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Your plan, image credits, and order history.</p>
      </div>

      <div className="border-b border-border pb-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-3xl font-medium">
              {remaining}
              <span className="text-lg text-muted-foreground"> / {organization.freeImageCredits}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Image credits remaining</p>
          </div>
          {isDemo ? (
            <p className="text-sm text-muted-foreground">
              {trialDaysRemaining} day{trialDaysRemaining === 1 ? "" : "s"} left in trial
            </p>
          ) : null}
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand" style={{ width: `${creditUsagePercent}%` }} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between border-b border-border py-3.5">
          <span className="text-sm text-muted-foreground">Plan</span>
          <span className="text-sm font-medium">{organization.plan ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between border-b border-border py-3.5">
          <span className="text-sm text-muted-foreground">Status</span>
          <span className="text-sm font-medium">{organization.subscriptionStatus ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between py-3.5">
          <span className="text-sm text-muted-foreground">Credits used</span>
          <span className="font-mono text-sm font-medium">{organization.usedImageCredits}</span>
        </div>
      </div>

      <div>
        <h2 className="border-b border-border pb-2.5 text-[13px] font-semibold">Order billing history</h2>

        {error ? (
          <div className="pt-4">
            <SectionAlert message={error} />
          </div>
        ) : null}

        {ordersLoading ? (
          <p className="pt-4 text-sm text-muted-foreground">Loading order history…</p>
        ) : orders.length === 0 ? (
          <p className="pt-4 text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div>
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0 hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{order.title}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {formatOrderNumber(order)}
                    {order.createdAt ? ` · ${formatOrderDate(order.createdAt)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusChip status={order.status} />
                  <span className="font-mono text-[13px]">{formatMoney(order.totalAmount, order.currency)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
