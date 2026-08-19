"use client";

import { useEffect, useState } from "react";
import { listOrderDeliverables } from "@/lib/asset-client";
import { listOrderUploads } from "@/lib/upload-client";
import type { SourceUploadRecord, DeliverableRecord } from "@repo/upload-gallery";

// One lightweight list call per card to find its first real image — the
// same real presigned-preview data used elsewhere, just resolved per-order
// since board cards don't carry an upload/asset in the /orders response.
export function useOrderThumbnail(orderId: string, kind: "upload" | "asset") {
  const [upload, setUpload] = useState<SourceUploadRecord | null>(null);
  const [asset, setAsset] = useState<DeliverableRecord | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (kind === "upload") {
      listOrderUploads(orderId)
        .then((items) => {
          if (!cancelled) setUpload(items[0] ?? null);
        })
        .catch(() => {
          if (!cancelled) setUpload(null);
        });
    } else {
      listOrderDeliverables(orderId)
        .then((items) => {
          if (!cancelled) setAsset(items[0] ?? null);
        })
        .catch(() => {
          if (!cancelled) setAsset(null);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [orderId, kind]);

  return { upload, asset };
}
