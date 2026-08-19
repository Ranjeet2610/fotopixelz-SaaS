export function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return (
    <main className="flex min-h-[50vh] flex-1 items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
    </main>
  );
}
