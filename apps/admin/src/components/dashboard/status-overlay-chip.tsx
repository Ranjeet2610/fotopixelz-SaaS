import { getStatusBucket } from "@/components/ui";

const BUCKET_VAR: Record<string, string> = {
  success: "var(--ui-color-success)",
  warning: "var(--ui-color-warning)",
  error: "var(--ui-color-error)",
  info: "var(--ui-color-info)",
  neutral: "var(--foreground)",
};

// On-image status chip for board/intake card thumbnails — @repo/ui's Badge
// is a pill styled for surfaces, not for overlaying photos, so this reuses
// the exact same status->bucket mapping (getStatusBucket, exported from
// ./ui) with an overlay-appropriate treatment instead of a second mapping.
export function StatusOverlayChip({ status, className }: { status: string; className?: string }) {
  const bucket = getStatusBucket(status);
  const color = BUCKET_VAR[bucket] ?? BUCKET_VAR.neutral;

  return (
    <span
      className={`status-overlay-chip${className ? ` ${className}` : ""}`}
      style={{ backgroundColor: `color-mix(in oklch, ${color} 88%, transparent)` }}
    >
      <span className="status-overlay-chip-dot" aria-hidden />
      {status.replaceAll("_", " ")}
    </span>
  );
}
