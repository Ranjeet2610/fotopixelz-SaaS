"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useOrganization } from "@/components/organization-provider";
import { LoadingBlock } from "@/components/loading-block";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, apiRequest } from "@/lib/api-client";
import type { CreatedOrder, Paginated } from "@/lib/catalog-types";
import {
  formatOrderDate,
  formatOrderNumber,
  getClientOrderStatusLabel,
} from "@/lib/order-status";

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export default function OrdersPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [orders, setOrders] = useState<CreatedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (orgLoading || loading) {
    return <LoadingBlock label="Loading orders..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Create and track your image editing orders.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/orders/new">New order</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your orders</CardTitle>
          <CardDescription>
            {orders.length === 0
              ? "No orders yet. Start with a new order."
              : `${orders.length} order${orders.length === 1 ? "" : "s"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="mb-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {orders.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-medium">No orders yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use the guided wizard to create your first draft order.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/orders/new">Create order</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Images</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.title}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          #{formatOrderNumber(order.id)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.createdAt ? formatOrderDate(order.createdAt) : "—"}
                    </TableCell>
                    <TableCell>{getClientOrderStatusLabel(order.status)}</TableCell>
                    <TableCell className="text-right">{order.totalImages}</TableCell>
                    <TableCell className="text-right">{order.creditsUsed}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(order.totalAmount, order.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/orders/${order.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
