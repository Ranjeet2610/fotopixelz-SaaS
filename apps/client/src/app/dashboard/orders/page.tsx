"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOrganization } from "@/components/organization-provider";
import { LoadingBlock } from "@/components/loading-block";
import { OrderRow } from "@/components/dashboard/order-row";
import { SectionAlert } from "@/components/dashboard/section-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiRequest } from "@/lib/api-client";
import type { CreatedOrder, Paginated } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";

type SummaryBucket = {
  key: string;
  label: string;
  statuses: string[];
};

const SUMMARY_BUCKETS: SummaryBucket[] = [
  { key: "AWAITING_UPLOAD", label: "Awaiting upload", statuses: ["DRAFT", "SUBMITTED"] },
  { key: "IN_PRODUCTION", label: "In production", statuses: ["ASSIGNED", "IN_PROGRESS"] },
  { key: "READY_FOR_QA", label: "Ready for QA", statuses: ["READY_FOR_QA"] },
  { key: "REVISION", label: "Revision", statuses: ["REVISION_REQUIRED"] },
  { key: "DELIVERED", label: "Delivered", statuses: ["DELIVERED"] },
];

export default function OrdersPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [orders, setOrders] = useState<CreatedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeBucket, setActiveBucket] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!organization?.id) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<Paginated<CreatedOrder>>("/orders", {
        query: { organizationId: organization.id, limit: 100 },
      });
      setOrders(data.items ?? []);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : "Failed to load orders",
      );
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (orgLoading) {
      return;
    }

    if (!organization?.id) {
      setLoading(false);
      return;
    }

    void loadOrders();
  }, [loadOrders, orgLoading, organization?.id]);

  const bucketCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const bucket of SUMMARY_BUCKETS) {
      counts.set(
        bucket.key,
        orders.filter((order) => bucket.statuses.includes(order.status)).length,
      );
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const activeStatuses = SUMMARY_BUCKETS.find((bucket) => bucket.key === activeBucket)?.statuses;
    const query = search.trim().toLowerCase();

    return orders
      .filter((order) => (activeStatuses ? activeStatuses.includes(order.status) : true))
      .filter((order) => {
        if (!query) return true;
        return (
          order.title.toLowerCase().includes(query) ||
          (order.orderNumber ?? "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());
  }, [orders, search, activeBucket]);

  if (orgLoading || loading) {
    return <LoadingBlock label="Loading orders..." />;
  }

  const hasAnyOrders = orders.length > 0;

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Order workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">Orders</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Every order you&apos;ve placed, and where it stands in production.
          </p>
        </div>
        <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Link href="/dashboard/orders/new">New order</Link>
        </Button>
      </div>

      {error ? <SectionAlert message={error} /> : null}

      {!hasAnyOrders ? (
        <div className="flex flex-col items-start gap-3 border-l-2 border-border py-2 pl-5">
          <div>
            <p className="text-base font-medium">No production yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Start your first image-editing order and your production workspace will appear here.
            </p>
          </div>
          <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
            <Link href="/dashboard/orders/new">New order</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Production ledger + search: one control strip, not two floating
              blocks — status navigation on the left, search on the right,
              sharing the same top/bottom rules (docs/CLIENT-VISUAL-DIRECTION.md). */}
          <div className="flex flex-col border-y border-border sm:flex-row sm:items-stretch sm:justify-between">
            <div className="flex flex-wrap">
              <button
                type="button"
                onClick={() => setActiveBucket(null)}
                className={cn(
                  "flex flex-col items-start gap-1 border-r border-border py-3 pr-5 text-left transition-colors first:pl-0",
                  activeBucket === null ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className={cn("font-mono text-lg leading-none", activeBucket === null && "text-brand")}>
                  {orders.length}
                </span>
                <span className="text-[10.5px] font-bold tracking-wide uppercase">All orders</span>
              </button>
              {SUMMARY_BUCKETS.map((bucket) => (
                <button
                  key={bucket.key}
                  type="button"
                  onClick={() => setActiveBucket((current) => (current === bucket.key ? null : bucket.key))}
                  className={cn(
                    "flex flex-col items-start gap-1 border-r border-border px-5 py-3 text-left transition-colors last:border-r-0",
                    activeBucket === bucket.key
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-lg leading-none",
                      activeBucket === bucket.key && "text-brand",
                    )}
                  >
                    {bucketCounts.get(bucket.key)}
                  </span>
                  <span className="text-[10.5px] font-bold tracking-wide uppercase">{bucket.label}</span>
                </button>
              ))}
            </div>

            <div className="relative flex items-center py-3 sm:w-64 sm:py-0 sm:pl-5">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground sm:left-7.5" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search orders"
                className="border-transparent bg-transparent pl-8 focus-visible:border-ring sm:pl-9"
                aria-label="Search orders"
              />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between border-b border-border pb-2.5">
              <p className="text-[10.5px] font-bold tracking-wide text-muted-foreground uppercase">
                Production records
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {filteredOrders.length} of {orders.length}
              </p>
            </div>

            {filteredOrders.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No orders match this filter.</p>
            ) : (
              filteredOrders.map((order) => <OrderRow key={order.id} order={order} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}
