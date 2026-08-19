import Link from "next/link";
import type { CreatedOrder } from "@/lib/catalog-types";
import { formatOrderNumber } from "@/lib/order-status";
import { StatusChip } from "./status-chip";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

// A quiet, compact record — deliberate visual contrast against the vivid
// production sections above it (docs/CLIENT-DASHBOARD.md §2.7).
export function OrderLog({ orders }: { orders: CreatedOrder[] }) {
  return (
    <div className="border-t border-border">
      {/* Desktop / tablet: grid-row table. Mobile: stacked card list. */}
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/dashboard/orders/${order.id}`}
          className="flex flex-col gap-1.5 border-b border-border px-1 py-2.5 hover:bg-muted/40 sm:grid sm:grid-cols-[40px_130px_1fr_150px_90px_90px] sm:items-center sm:gap-3.5"
        >
          <div className="hidden size-[30px] shrink-0 rounded-md bg-muted sm:block" aria-hidden />
          <div className="flex items-center justify-between sm:contents">
            <span className="font-mono text-[11.5px] text-muted-foreground">{formatOrderNumber(order)}</span>
            <span className="text-[13px] font-medium sm:font-normal">{order.title}</span>
          </div>
          <div className="flex items-center justify-between sm:contents">
            <StatusChip status={order.status} />
            <span className="text-xs text-muted-foreground">{order.totalImages} images</span>
          </div>
          <span className="hidden font-mono text-[12.5px] sm:block sm:text-right">
            {formatMoney(order.totalAmount, order.currency)}
          </span>
        </Link>
      ))}
    </div>
  );
}
