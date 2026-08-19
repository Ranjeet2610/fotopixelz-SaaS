"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOrganization } from "@/components/organization-provider";
import { LoadingBlock } from "@/components/loading-block";
import { SectionAlert } from "@/components/dashboard/section-alert";
import { Thumbnail } from "@/components/dashboard/thumbnail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiRequest } from "@/lib/api-client";
import { downloadAllAssets, downloadAsset } from "@/lib/asset-client";
import type { AssetRecord } from "@/lib/asset-types";
import { formatOrderDate, formatOrderNumber } from "@/lib/order-status";

export default function AssetsPage() {
  const { organization, loading: orgLoading } = useOrganization();
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingGroupId, setDownloadingGroupId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
    const query = search.trim().toLowerCase();
    const filtered = query
      ? assets.filter(
          (asset) =>
            (asset.name || asset.fileName).toLowerCase().includes(query) ||
            (asset.order?.title ?? "").toLowerCase().includes(query),
        )
      : assets;

    const groups = new Map<string, { orderTitle: string; items: AssetRecord[] }>();

    for (const asset of filtered) {
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
  }, [assets, search]);

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

  const handleDownloadGroup = async (orderId: string, items: AssetRecord[]) => {
    setDownloadingGroupId(orderId);
    setError(null);
    try {
      await downloadAllAssets(items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Download failed");
    } finally {
      setDownloadingGroupId(null);
    }
  };

  if (orgLoading || loading) {
    return <LoadingBlock label="Loading assets..." />;
  }

  const hasAnyAssets = assets.length > 0;

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Asset library</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">Assets</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Download deliverables from your completed orders.
          </p>
        </div>
      </div>

      {error ? <SectionAlert message={error} /> : null}

      {!hasAnyAssets ? (
        <div className="flex flex-col items-start gap-3 border-l-2 border-border py-2 pl-5">
          <div>
            <p className="text-base font-medium">No deliverables yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Delivered files will appear here once your orders are completed.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/orders">View orders</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by file or order name"
              className="pl-8"
              aria-label="Search assets"
            />
          </div>

          {groupedAssets.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No assets match this search.</p>
          ) : (
            <div className="space-y-9">
              {groupedAssets.map((group) => (
                <section key={group.orderId}>
                  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-2.5">
                    <div>
                      <h2 className="text-[15px] font-semibold">{group.orderTitle}</h2>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        Order #{formatOrderNumber(group.orderId)} · {group.items.length} file
                        {group.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleDownloadGroup(group.orderId, group.items)}
                        disabled={downloadingGroupId === group.orderId}
                      >
                        {downloadingGroupId === group.orderId ? "Preparing…" : "Download all"}
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/orders/${group.orderId}`}>View order</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {group.items.map((asset) => (
                      <div key={asset.id} className="flex flex-col gap-2">
                        <div className="relative h-40 overflow-hidden rounded-lg sm:h-44">
                          <Thumbnail asset={asset} className="h-full w-full" />
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-medium" title={asset.name || asset.fileName}>
                              {asset.name || asset.fileName}
                            </p>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {formatOrderDate(asset.createdAt)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => void handleDownload(asset)}
                            disabled={downloadingId === asset.id}
                          >
                            {downloadingId === asset.id ? "…" : "Download"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
