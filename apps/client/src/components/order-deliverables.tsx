"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Thumbnail } from "@/components/dashboard/thumbnail";
import { LoadingBlock } from "@/components/loading-block";
import {
  downloadAllAssets,
  downloadAsset,
  estimateAssetFileSize,
  listOrderDeliverables,
} from "@/lib/asset-client";
import type { AssetRecord } from "@/lib/asset-types";
import { formatBytes } from "@/lib/format-bytes";
import { formatOrderDate } from "@/lib/order-status";

type OrderDeliverablesProps = {
  orderId: string;
  orderUpdatedAt?: string | null;
};

function formatFileSize(asset: AssetRecord) {
  const size = estimateAssetFileSize(asset);
  return size ? formatBytes(size) : "—";
}

export function OrderDeliverables({ orderId, orderUpdatedAt }: OrderDeliverablesProps) {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const loadDeliverables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listOrderDeliverables(orderId);
      setAssets(items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load deliverables");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadDeliverables();
  }, [loadDeliverables]);

  const deliveryDate = useMemo(() => {
    if (orderUpdatedAt) {
      return formatOrderDate(orderUpdatedAt);
    }

    const latestAsset = assets[0];
    return latestAsset?.updatedAt ? formatOrderDate(latestAsset.updatedAt) : "—";
  }, [assets, orderUpdatedAt]);

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

  const handleDownloadAll = async () => {
    if (assets.length === 0) {
      return;
    }

    setDownloadingAll(true);
    setError(null);
    try {
      await downloadAllAssets(assets);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Download failed");
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <Card className="border-status-success/30 bg-status-success/5">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Deliverables</CardTitle>
          <CardDescription>Your edited files are ready to download.</CardDescription>
        </div>
        {assets.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleDownloadAll()}
            disabled={downloadingAll}
          >
            {downloadingAll ? "Preparing downloads…" : "Download all deliverables"}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Total delivered files</p>
            <p className="text-lg font-semibold">{assets.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Delivery date</p>
            <p className="text-lg font-semibold">{deliveryDate}</p>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <LoadingBlock label="Loading deliverables..." />
        ) : assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deliverable files are available yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {assets.map((asset) => (
              <div key={asset.id} className="flex flex-col gap-2">
                <div className="relative h-40 overflow-hidden rounded-lg sm:h-44">
                  <Thumbnail asset={asset} className="h-full w-full" />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium" title={asset.name || asset.fileName}>
                      {asset.name || asset.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(asset)}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleDownload(asset)}
                    disabled={downloadingId === asset.id}
                  >
                    {downloadingId === asset.id ? "…" : "Download"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {assets.length > 1 ? (
          <p className="text-xs text-muted-foreground">
            ZIP download is not available yet. Use download all to fetch each file individually.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
