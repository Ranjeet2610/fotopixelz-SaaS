// Skeleton shapes matching each section's real geometry, per
// docs/CLIENT-DASHBOARD.md §10 — image blocks + text bars, not a spinner.
function Bar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />;
}

export function HeroSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <Bar className="h-[280px] w-full rounded-none sm:h-[340px]" />
      <div className="space-y-2 p-5">
        <Bar className="h-3 w-24" />
        <Bar className="h-5 w-64" />
      </div>
    </div>
  );
}

export function FilmstripSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-border">
          <Bar className="h-[130px] w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Bar className="h-3 w-full" />
            <Bar className="h-2.5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProofSheetSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-8">
      {Array.from({ length: count }).map((_, index) => (
        <Bar key={index} className="h-24 w-full" />
      ))}
    </div>
  );
}

export function OrderLogSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2 border-t border-border pt-3">
      {Array.from({ length: count }).map((_, index) => (
        <Bar key={index} className="h-9 w-full" />
      ))}
    </div>
  );
}
