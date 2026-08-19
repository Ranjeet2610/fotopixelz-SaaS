import type { HTMLAttributes, ReactNode } from "react";

export type BadgeStatus = "success" | "warning" | "error" | "info" | "neutral";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  status?: BadgeStatus;
  showDot?: boolean;
  children?: ReactNode;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Status badge. Color is always drawn from the status palette
 * (success/warning/error/info) or a neutral fallback — never from the
 * Electric Coral brand accent. See docs/DESIGN-SYSTEM.md §2/§8.
 */
export function Badge({ status = "neutral", showDot = true, className, children, ...props }: BadgeProps) {
  return (
    <span className={cx("ui-badge", `ui-badge--${status}`, className)} {...props}>
      {showDot ? <span className="ui-badge__dot" aria-hidden /> : null}
      {children}
    </span>
  );
}
