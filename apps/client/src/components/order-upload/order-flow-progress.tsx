import { cn } from "@/lib/utils";

const STEP_LABELS = ["Create order", "Upload images", "Submit"] as const;

export function OrderFlowProgress({
  currentStep,
  completed = false,
}: {
  currentStep: 1 | 2 | 3;
  completed?: boolean;
}) {
  return (
    <nav aria-label="Order progress" className="w-full">
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isComplete = completed || stepNumber < currentStep;

          return (
            <li key={label} className="flex flex-1 items-center gap-2 sm:flex-col sm:gap-1.5">
              <div className="flex items-center gap-2 sm:flex-col">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isComplete && "border-primary bg-primary/10 text-primary",
                    !isActive && !isComplete && "border-border text-muted-foreground",
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isComplete ? "✓" : stepNumber}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {index < STEP_LABELS.length - 1 ? (
                <div
                  className={cn(
                    "hidden h-px flex-1 bg-border sm:block",
                    isComplete && "bg-primary/40",
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
