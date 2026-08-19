"use client";

import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api-client";
import { listAssets } from "@/lib/asset-client";
import type { AssetRecord } from "@/lib/asset-types";
import type { CreatedOrder, Paginated } from "@/lib/catalog-types";
import { isPreUploadOrderStatus } from "@/lib/order-status";
import { listOrderUploads } from "@/lib/upload-client";
import type { UploadRecord } from "@/lib/upload-types";

const TERMINAL_STATUSES = new Set(["DELIVERED", "CANCELLED"]);

type FetchState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

function toErrorMessage(caught: unknown, fallback: string) {
  if (caught instanceof ApiError) return caught.message;
  if (caught instanceof Error) return caught.message;
  return fallback;
}

/**
 * Two independent fetches (orders, assets) so one section's failure never
 * blocks another (docs/CLIENT-DASHBOARD.md §11). Buckets are computed
 * client-side from real order/asset data only — nothing fabricated.
 */
export function useDashboardData(organizationId: string | undefined) {
  const [orders, setOrders] = useState<FetchState<CreatedOrder[]>>({ data: [], loading: true, error: null });
  const [assets, setAssets] = useState<FetchState<AssetRecord[]>>({ data: [], loading: true, error: null });
  const [heroUpload, setHeroUpload] = useState<UploadRecord | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    async function loadOrders() {
      setOrders((current) => ({ ...current, loading: true, error: null }));
      try {
        const data = await apiRequest<Paginated<CreatedOrder>>("/orders", {
          query: { organizationId, limit: 100 },
        });
        if (!cancelled) {
          setOrders({ data: data.items ?? [], loading: false, error: null });
        }
      } catch (caught) {
        if (!cancelled) {
          setOrders({ data: [], loading: false, error: toErrorMessage(caught, "Failed to load orders") });
        }
      }
    }

    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    async function loadAssets() {
      setAssets((current) => ({ ...current, loading: true, error: null }));
      try {
        const data = await listAssets({ organizationId, limit: 100 });
        if (!cancelled) {
          setAssets({ data: data.items ?? [], loading: false, error: null });
        }
      } catch (caught) {
        if (!cancelled) {
          setAssets({ data: [], loading: false, error: toErrorMessage(caught, "Failed to load assets") });
        }
      }
    }

    void loadAssets();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const activeOrders = orders.data
    .filter((order) => !TERMINAL_STATUSES.has(order.status))
    .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());

  const hero =
    activeOrders.find((order) => isPreUploadOrderStatus(order.status) || order.status === "UPLOADED") ??
    activeOrders[0] ??
    null;

  // Fetch the hero order's source uploads (for a real thumbnail) once known.
  useEffect(() => {
    if (!hero) {
      setHeroUpload(null);
      return;
    }
    let cancelled = false;
    listOrderUploads(hero.id)
      .then((uploads) => {
        if (!cancelled) {
          setHeroUpload(uploads.find((upload) => upload.status === "UPLOADED") ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setHeroUpload(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero?.id]);

  const remainingActive = activeOrders.filter((order) => order.id !== hero?.id);
  const upNext = remainingActive.slice(0, 2);
  const filmstrip = remainingActive.slice(2, 10);

  const deliveredAssets = assets.data.filter((asset) => asset.status === "DELIVERED");
  const proofSheetAssets = deliveredAssets.slice(0, 15);
  const proofSheetMoreCount = Math.max(0, deliveredAssets.length - proofSheetAssets.length);

  const log = [...orders.data]
    .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())
    .slice(0, 6);

  return {
    orders,
    assets,
    hero,
    heroUpload,
    upNext,
    filmstrip,
    proofSheetAssets,
    proofSheetMoreCount,
    log,
  };
}
