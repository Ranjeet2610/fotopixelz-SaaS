import { getOrderStatusBucket, getClientOrderStatusLabel } from "@/lib/order-status";
import { cn } from "@/lib/utils";

const BUCKET_INLINE_CLASSES: Record<string, string> = {
  success: "bg-status-success/10 text-status-success",
  warning: "bg-status-warning/10 text-status-warning",
  error: "bg-status-error/10 text-status-error",
  info: "bg-status-info/10 text-status-info",
  neutral: "bg-muted text-muted-foreground",
};

const BUCKET_OVERLAY_CLASSES: Record<string, string> = {
  success: "bg-status-success/90 text-status-success-foreground",
  warning: "bg-status-warning/90 text-status-warning-foreground",
  error: "bg-status-error/90 text-status-error-foreground",
  info: "bg-status-info/90 text-status-info-foreground",
  neutral: "bg-foreground/80 text-background",
};

type StatusChipProps = {
  status: string;
  variant?: "inline" | "overlay";
  className?: string;
};

// Real OrderStatus value, styled through the shared success/warning/error/info
// bucket mapping (docs/DESIGN-SYSTEM.md §2/§8) — never the brand accent
// color, per docs/CLIENT-DASHBOARD.md §7 and docs/REDESIGN-DIRECTION.md §7.1.
export function StatusChip({ status, variant = "inline", className }: StatusChipProps) {
  const bucket = getOrderStatusBucket(status);
  const label = getClientOrderStatusLabel(status);
  const classes = variant === "overlay" ? BUCKET_OVERLAY_CLASSES : BUCKET_INLINE_CLASSES;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
        classes[bucket],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}
