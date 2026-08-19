"use client";

import Link from "next/link";
import type { ApiRecord } from "@/lib/types";
import { textValue } from "@/lib/format";
import { StatusOverlayChip } from "./status-overlay-chip";
import { Thumbnail } from "./thumbnail";
import { useOrderThumbnail } from "./use-order-thumbnail";

type ProductionCardProps = {
  order: ApiRecord;
  orderNumber: string;
  status: string;
  assigneeLabel: string;
  thumbnailKind: "upload" | "asset";
};

// Board card — real thumbnail + status overlay + assignee, per
// docs/ADMIN-DASHBOARD.md §3 ("a card IS an order in that status").
export function ProductionCard({ order, orderNumber, status, assigneeLabel, thumbnailKind }: ProductionCardProps) {
  const orderId = textValue(order.id, "");
  const { upload, asset } = useOrderThumbnail(orderId, thumbnailKind);

  return (
    <Link href={`/admin/orders/${orderId}`} className="dash-production-card">
      <div className="dash-production-thumb" style={{ position: "relative" }}>
        <Thumbnail upload={upload} asset={asset} />
        <StatusOverlayChip status={status} className="dash-production-status" />
      </div>
      <div className="dash-production-body">
        <p className="dash-production-meta">{orderNumber}</p>
        <p className="dash-production-title">{textValue(order.title)}</p>
        <p className="dash-production-assignee">{assigneeLabel}</p>
      </div>
    </Link>
  );
}
