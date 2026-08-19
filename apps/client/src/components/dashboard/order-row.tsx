import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusChip } from "./status-chip";
import { TicketCorners } from "./ticket-corners";
import { Thumbnail } from "./thumbnail";
import type { CreatedOrder } from "@/lib/catalog-types";
import { formatOrderDate, formatOrderNumber } from "@/lib/order-status";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

// Real-status-derived production phrase — distinct wording from the
// StatusChip label so the row reads TITLE -> STATUS -> PRODUCTION STATE,
// never a second, competing status system.
function getProductionState(status: string) {
  switch (status) {
    case "DRAFT":
      return "Draft — not yet submitted";
    case "SUBMITTED":
      return "Awaiting your image upload";
    case "UPLOADED":
      return "Images uploaded — ready to submit";
    case "PENDING":
      return "Queued for assignment";
    case "ASSIGNED":
      return "Assigned to an editor";
    case "IN_PROGRESS":
      return "In the editing queue";
    case "READY_FOR_QA":
      return "In quality review";
    case "REVISION_REQUIRED":
      return "Revision requested";
    case "APPROVED":
      return "Approved — preparing delivery";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    default:
      return null;
  }
}

function getNextAction(status: string) {
  switch (status) {
    case "DRAFT":
      return "Continue upload";
    case "SUBMITTED":
      return "Upload images";
    case "UPLOADED":
      return "Submit order";
    case "REVISION_REQUIRED":
      return "View revision notes";
    case "DELIVERED":
      return "View deliverables";
    default:
      return "View order";
  }
}

// A production record, not a table row: a substantial image area leads,
// then title dominates, status/production-state follows, precision
// metadata sits in mono type, and one contextual action closes it out
// (docs/CLIENT-VISUAL-DIRECTION.md).
export function OrderRow({ order }: { order: CreatedOrder }) {
  const productionState = getProductionState(order.status);

  return (
    <Link
      href={`/dashboard/orders/${order.id}`}
      className="group grid grid-cols-[88px_1fr] items-start gap-4 border-b border-border py-5 transition-colors last:border-b-0 hover:bg-muted/30 sm:grid-cols-[120px_1fr_180px] sm:items-center sm:gap-6"
    >
      <div className="relative size-[88px] shrink-0 overflow-hidden rounded-md sm:size-[120px]">
        <Thumbnail className="h-full w-full" />
        <TicketCorners />
      </div>

      <div className="flex min-w-0 flex-col gap-2 py-0.5">
        <p className="truncate text-[17px] font-medium leading-snug sm:text-[19px]">{order.title}</p>

        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={order.status} />
          {productionState ? (
            <span className="text-[12.5px] text-muted-foreground">{productionState}</span>
          ) : null}
        </div>

        <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
          {formatOrderNumber(order)}
          {" · "}
          {order.createdAt ? formatOrderDate(order.createdAt) : "—"}
          {" · "}
          {order.totalImages} image{order.totalImages === 1 ? "" : "s"}
          {" · "}
          {formatMoney(order.totalAmount, order.currency)}
        </p>
      </div>

      <div className="col-span-2 flex items-center gap-1 pl-[104px] text-[12.5px] font-medium text-foreground/70 transition-colors group-hover:text-brand sm:col-span-1 sm:justify-end sm:pl-0">
        {getNextAction(order.status)}
        <ChevronRight className="size-3.5" aria-hidden />
      </div>
    </Link>
  );
}
