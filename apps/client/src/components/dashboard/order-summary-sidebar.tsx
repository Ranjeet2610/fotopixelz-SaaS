import type { CreatedOrder } from "@/lib/catalog-types";
import { formatOrderDate } from "@/lib/order-status";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-[13px] font-medium">{value}</span>
    </div>
  );
}

// Static order metadata — service/addon lines, dates, totals already present
// on the fetched order — separate from OrderUploadPanel's live, upload-aware
// billing card (which recomputes as uploads change).
export function OrderSummarySidebar({ order }: { order: CreatedOrder }) {
  return (
    <aside className="flex flex-col gap-6">
      <section>
        <h2 className="border-b border-border pb-2.5 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
          Order information
        </h2>
        <div className="divide-y divide-border">
          <Row label="Order number" value={order.orderNumber} />
          <Row label="Created" value={order.createdAt ? formatOrderDate(order.createdAt) : "—"} />
          {order.dueDate ? <Row label="Due date" value={formatOrderDate(order.dueDate)} /> : null}
          <Row label="Images" value={String(order.totalImages)} />
          <Row label="Credits used" value={String(order.creditsUsed)} />
        </div>
      </section>

      {order.items && order.items.length > 0 ? (
        <section>
          <h2 className="border-b border-border pb-2.5 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
            Services
          </h2>
          <div className="divide-y divide-border">
            {order.items.map((line) => (
              <div key={line.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0 pr-3">
                  <p className="truncate text-[13px] font-medium">{line.service?.name ?? "Service"}</p>
                  <p className="text-[11.5px] text-muted-foreground">Qty {line.quantity}</p>
                </div>
                <span className="font-mono text-[13px]">{formatMoney(line.subtotal, order.currency)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {order.addons && order.addons.length > 0 ? (
        <section>
          <h2 className="border-b border-border pb-2.5 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
            Add-ons
          </h2>
          <div className="divide-y divide-border">
            {order.addons.map((line) => (
              <div key={line.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0 pr-3">
                  <p className="truncate text-[13px] font-medium">{line.addon?.name ?? "Add-on"}</p>
                  <p className="text-[11.5px] text-muted-foreground">Qty {line.quantity}</p>
                </div>
                <span className="font-mono text-[13px]">{formatMoney(line.subtotal, order.currency)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-[13px] font-medium">Order total</span>
          <span className="font-mono text-base font-semibold">{formatMoney(order.totalAmount, order.currency)}</span>
        </div>
      </section>
    </aside>
  );
}
