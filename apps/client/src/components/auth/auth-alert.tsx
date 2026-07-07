type AuthAlertProps = {
  message: string;
  variant?: "error" | "success";
};

export function AuthAlert({ message, variant = "error" }: AuthAlertProps) {
  const styles =
    variant === "error"
      ? "border-destructive/25 bg-destructive/5 text-destructive"
      : "border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300";

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles}`}
      role="alert"
    >
      {message}
    </div>
  );
}
