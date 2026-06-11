import { cn } from "@/lib/utils";

const TIMELINE_STEPS = [
  { key: "submitted", label: "Submitted", statuses: ["PENDING", "ASSIGNED", "IN_PROGRESS", "READY_FOR_QA", "REVISION_REQUIRED", "APPROVED", "DELIVERED"] },
  { key: "assigned", label: "Assigned", statuses: ["ASSIGNED", "IN_PROGRESS", "READY_FOR_QA", "REVISION_REQUIRED", "APPROVED", "DELIVERED"] },
  { key: "editing", label: "Editing", statuses: ["IN_PROGRESS", "REVISION_REQUIRED", "READY_FOR_QA", "APPROVED", "DELIVERED"] },
  { key: "qa", label: "QA Review", statuses: ["READY_FOR_QA", "APPROVED", "DELIVERED"] },
  { key: "delivered", label: "Delivered", statuses: ["DELIVERED"] },
] as const;

function stepIncludes(statuses: readonly string[], orderStatus: string) {
  return statuses.includes(orderStatus);
}

function stepState(orderStatus: string, stepStatuses: readonly string[], stepIndex: number) {
  if (orderStatus === "CANCELLED") {
    return "pending";
  }

  if (stepIncludes(stepStatuses, orderStatus)) {
    const activeIndex = TIMELINE_STEPS.findIndex((step) => stepIncludes(step.statuses, orderStatus));
    if (activeIndex === stepIndex) {
      return "active";
    }
    return "complete";
  }

  const furthestReached = TIMELINE_STEPS.findIndex((step) => stepIncludes(step.statuses, orderStatus));
  return stepIndex < furthestReached ? "complete" : "pending";
}

export function OrderStatusTimeline({ status }: { status: string }) {
  if (status === "DRAFT" || status === "UPLOADED") {
    return null;
  }

  return (
    <section className="rounded-xl border p-4">
      <h2 className="text-sm font-medium">Order progress</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-5">
        {TIMELINE_STEPS.map((step, index) => {
          const state = stepState(status, step.statuses, index);

          return (
            <li key={step.key} className="flex flex-col gap-2">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border text-xs font-semibold",
                  state === "active" && "border-primary bg-primary text-primary-foreground",
                  state === "complete" && "border-primary bg-primary/10 text-primary",
                  state === "pending" && "border-border text-muted-foreground",
                )}
              >
                {state === "complete" ? "✓" : index + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  state === "pending" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
