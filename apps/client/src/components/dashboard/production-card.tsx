import Link from "next/link";
import type { ReactNode } from "react";
import { StageTrack } from "./stage-track";
import { StatusChip } from "./status-chip";
import { Thumbnail } from "./thumbnail";
import { formatOrderNumber } from "@/lib/order-status";
import { cn } from "@/lib/utils";

type ProductionCardProps = {
  orderId: string;
  orderNumber: string;
  title: string;
  status: string;
  meta: string;
  upload?: { id: string; fileName: string; mimeType: string; status: string } | null;
  showStageTrack?: boolean;
  /** "vertical" (filmstrip: image on top) or "horizontal" (up-next: image left). */
  orientation?: "vertical" | "horizontal";
  className?: string;
  /** Extra content below the caption (e.g. a due-date line). */
  footer?: ReactNode;
};

// Shared image-forward card shape used by the filmstrip and up-next stack
// (docs/CLIENT-DASHBOARD.md §3) — image leads, status overlaid on the image
// itself, caption + optional footer alongside/below.
export function ProductionCard({
  orderId,
  orderNumber,
  title,
  status,
  meta,
  upload,
  showStageTrack = true,
  orientation = "vertical",
  className,
  footer,
}: ProductionCardProps) {
  const horizontal = orientation === "horizontal";

  return (
    <Link
      href={`/dashboard/orders/${orderId}`}
      className={cn(
        "group flex overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/30",
        horizontal ? "flex-row" : "flex-col",
        className,
      )}
    >
      <div className={cn("relative shrink-0", horizontal ? "h-full w-[120px]" : "h-[130px] w-full")}>
        <Thumbnail upload={upload} className="h-full w-full" />
        <StatusChip
          status={status}
          variant="overlay"
          className={horizontal ? "absolute bottom-2 left-2" : "absolute top-2 right-2"}
        />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 p-3">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug">{title}</p>
        <p className="font-mono text-[10.5px] text-muted-foreground">
          {formatOrderNumber(orderNumber)} · {meta}
        </p>
        {showStageTrack ? <StageTrack status={status} /> : null}
        {footer}
      </div>
    </Link>
  );
}
