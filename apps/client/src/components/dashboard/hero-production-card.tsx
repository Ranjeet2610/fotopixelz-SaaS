import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusChip } from "./status-chip";
import { TicketCorners } from "./ticket-corners";
import { Thumbnail } from "./thumbnail";
import { formatOrderNumber } from "@/lib/order-status";

type HeroProductionCardProps = {
  orderId: string;
  orderNumber: string;
  title: string;
  status: string;
  meta: string;
  upload?: { id: string; fileName: string; mimeType: string; status: string } | null;
  ctaLabel: string;
};

// Surfaces the single most actionable order — "continue where you left off"
// (docs/CLIENT-DASHBOARD.md §2.3), not a random recent order.
export function HeroProductionCard({
  orderId,
  orderNumber,
  title,
  status,
  meta,
  upload,
  ctaLabel,
}: HeroProductionCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]">
      <div className="relative h-[280px] sm:h-[340px]">
        {upload ? (
          <Thumbnail upload={upload} className="h-full w-full" />
        ) : (
          <div className="relative flex h-full w-full flex-col justify-between bg-card px-8 py-7">
            <TicketCorners />
            <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
              {formatOrderNumber(orderNumber)} · AWAITING UPLOAD
            </p>
            <h2 className="text-[28px] leading-tight font-semibold tracking-tight sm:text-[34px]">{title}</h2>
            <p className="font-mono text-[11px] tracking-wide text-muted-foreground">{meta}</p>
          </div>
        )}
        <StatusChip status={status} variant="overlay" className="absolute top-4 right-4" />
      </div>
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{formatOrderNumber(orderNumber)}</p>
          <h2 className="mt-1 text-lg font-semibold sm:text-xl">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
        </div>
        <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90 shrink-0">
          <Link href={`/dashboard/orders/${orderId}`}>{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
