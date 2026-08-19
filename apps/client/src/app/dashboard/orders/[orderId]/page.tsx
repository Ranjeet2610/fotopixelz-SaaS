"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { OrderFlowProgress } from "@/components/order-upload/order-flow-progress";
import { OrderUploadPanel } from "@/components/order-upload/order-upload-panel";
import { OrderDeliverables } from "@/components/order-deliverables";
import { ClientOrderComments } from "@/components/client-order-comments";
import { OrderStatusTimeline } from "@/components/order-status-timeline";
import { OrderSummarySidebar } from "@/components/dashboard/order-summary-sidebar";
import { StatusChip } from "@/components/dashboard/status-chip";
import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/loading-block";
import { ApiError, apiRequest } from "@/lib/api-client";
import type { CreatedOrder } from "@/lib/catalog-types";
import { formatOrderDate, formatOrderNumber, isPreUploadOrderStatus } from "@/lib/order-status";

function flowStep(status: string): 1 | 2 | 3 {
  if (isPreUploadOrderStatus(status)) {
    return 2;
  }
  return 3;
}

function isFlowCompleted(status: string) {
  return status === "PENDING" || (!isPreUploadOrderStatus(status) && status !== "UPLOADED");
}

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<CreatedOrder>(`/orders/${orderId}`);
      setOrder(data);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : "Failed to load order",
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      void loadOrder();
    }
  }, [loadOrder, orderId]);

  const currentStep = useMemo(() => (order ? flowStep(order.status) : 2), [order]);
  const flowCompleted = useMemo(() => (order ? isFlowCompleted(order.status) : false), [order]);

  if (loading) {
    return <LoadingBlock label="Loading order..." />;
  }

  if (error || !order) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
        <p className="text-sm text-destructive">{error ?? "Order not found"}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <div>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          All orders
        </Link>

        <div className="mt-3 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{order.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <StatusChip status={order.status} variant="inline" />
              <span className="font-mono text-[12px] text-muted-foreground">
                {formatOrderNumber(order)}
                {order.createdAt ? ` · ${formatOrderDate(order.createdAt)}` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          {!flowCompleted ? (
            <OrderFlowProgress currentStep={currentStep} completed={flowCompleted} />
          ) : (
            <OrderStatusTimeline status={order.status} />
          )}

          <OrderUploadPanel order={order} onOrderUpdated={setOrder} />

          {order.status === "DELIVERED" ? (
            <OrderDeliverables orderId={order.id} orderUpdatedAt={order.updatedAt} />
          ) : null}

          {order.instructions ? (
            <section className="border-t border-border pt-5">
              <h2 className="text-[13px] font-semibold">Instructions</h2>
              <p className="mt-1.5 text-sm whitespace-pre-wrap text-muted-foreground">{order.instructions}</p>
            </section>
          ) : null}

          {order.status !== "DRAFT" && order.status !== "SUBMITTED" && order.status !== "UPLOADED" ? (
            <ClientOrderComments orderId={order.id} readOnly={order.status === "DELIVERED"} />
          ) : null}
        </div>

        <OrderSummarySidebar order={order} />
      </div>
    </div>
  );
}
