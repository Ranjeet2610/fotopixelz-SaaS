"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { downloadAsset } from "@/lib/asset-client";
import type { AssetRecord } from "@/lib/asset-types";
import { formatOrderDate, formatOrderNumber } from "@/lib/order-status";

export default function AssetsPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    if (!organization?.id) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ items: AssetRecord[] }>("/assets", {
        query: { organizationId: organization.id, limit: 100 },
      });
      setAssets(data.items ?? []);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : "Failed to load assets",
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

    void loadAssets();
  }, [loadAssets, orgLoading, organization?.id]);

  const groupedAssets = useMemo(() => {
    const groups = new Map<string, { orderTitle: string; items: AssetRecord[] }>();

    for (const asset of assets) {
      const existing = groups.get(asset.orderId);
      if (existing) {
        existing.items.push(asset);
        continue;
      }

      groups.set(asset.orderId, {
        orderTitle: asset.order?.title ?? "Order",
        items: [asset],
      });
    }

    return Array.from(groups.entries()).map(([orderId, group]) => ({
      orderId,
      orderTitle: group.orderTitle,
      items: group.items,
    }));
  }, [assets]);

  const handleDownload = async (asset: AssetRecord) => {
    setDownloadingId(asset.id);
    setError(null);
    try {
      await downloadAsset(asset);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  if (orgLoading || loading) {
    return <LoadingBlock label="Loading assets..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
        <p className="text-sm text-muted-foreground">
          Download deliverables from your completed orders.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {groupedAssets.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No deliverables yet</CardTitle>
            <CardDescription>
              Delivered files will appear here once your orders are completed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/orders">View orders</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        groupedAssets.map((group) => (
          <Card key={group.orderId}>
            <CardHeader>
              <CardTitle>{group.orderTitle}</CardTitle>
              <CardDescription>
                Order #{formatOrderNumber(group.orderId)} · {group.items.length} file
                {group.items.length === 1 ? "" : "s"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Asset name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Download</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>#{formatOrderNumber(group.orderId)}</TableCell>
                      <TableCell>{asset.name || asset.fileName}</TableCell>
                      <TableCell>{formatOrderDate(asset.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void handleDownload(asset)}
                          disabled={downloadingId === asset.id}
                        >
                          {downloadingId === asset.id ? "Downloading…" : "Download"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/orders/${group.orderId}`}>View order</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
