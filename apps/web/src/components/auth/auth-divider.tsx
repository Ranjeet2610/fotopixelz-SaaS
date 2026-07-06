export function AuthDivider() {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-border/80" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-background px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          or continue with email
        </span>
      </div>
    </div>
  );
}
