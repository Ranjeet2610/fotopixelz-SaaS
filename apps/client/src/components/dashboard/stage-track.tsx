import { cn } from "@/lib/utils";

// Discrete 5-segment visualization of a real OrderStatus's position in the
// pipeline (uploaded -> assigned -> in progress -> QA -> delivered). This is
// a read-only view of the actual status enum, not a separately computed
// progress percentage (docs/CLIENT-DASHBOARD.md §7).
const STAGE_ORDER = ["UPLOADED", "ASSIGNED", "IN_PROGRESS", "READY_FOR_QA", "DELIVERED"];

function stageIndex(status: string) {
  switch (status) {
    case "DRAFT":
    case "SUBMITTED":
      return -1;
    case "UPLOADED":
    case "PENDING":
      return 0;
    case "ASSIGNED":
      return 1;
    case "IN_PROGRESS":
    case "REVISION_REQUIRED":
      return 2;
    case "READY_FOR_QA":
    case "APPROVED":
      return 3;
    case "DELIVERED":
      return 4;
    default:
      return -1;
  }
}

export function StageTrack({ status, className }: { status: string; className?: string }) {
  const active = stageIndex(status);

  return (
    <div className={cn("flex gap-0.5", className)} aria-hidden>
      {STAGE_ORDER.map((stage, index) => (
        <div
          key={stage}
          className={cn("h-[3px] flex-1 rounded-full", index <= active ? "bg-foreground" : "bg-border")}
        />
      ))}
    </div>
  );
}
