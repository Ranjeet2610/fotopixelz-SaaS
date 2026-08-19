import Link from "next/link";
import type { CreatedOrder } from "@/lib/catalog-types";
import { formatOrderNumber } from "@/lib/order-status";

function formatLogTimestamp(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

// Real, always-populated record of account activity — replaces a
// second column that goes empty the instant fewer than 2 other active
// orders exist, which was the structural cause of "too empty"
// (docs/CLIENT-VISUAL-DIRECTION.md §9.3). Uses only real order fields
// already fetched by useDashboardData — no separate events endpoint,
// no fabricated audit trail.
export function ProductionLog({ orders }: { orders: CreatedOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col gap-3.5">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Production log</p>
        <p className="font-mono text-xs text-muted-foreground">No account activity yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Production log</p>
      <ol className="flex flex-col">
        {orders.map((order) => (
          <li key={order.id} className="border-l border-border pl-3.5 pb-4 last:pb-0">
            <Link href={`/dashboard/orders/${order.id}`} className="group block">
              <p className="font-mono text-[10.5px] text-muted-foreground">
                {formatLogTimestamp(order.updatedAt)} · {formatOrderNumber(order)}
              </p>
              <p className="mt-0.5 text-[13px] font-medium group-hover:underline">{order.title}</p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
