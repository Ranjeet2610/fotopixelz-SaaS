// Generalizes the existing inline error pattern used in
// apps/client/src/app/dashboard/orders/page.tsx, so a single section's fetch
// failure doesn't take down the rest of the dashboard (docs/CLIENT-DASHBOARD.md §11).
export function SectionAlert({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}
