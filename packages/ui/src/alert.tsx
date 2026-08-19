import type { HTMLAttributes, ReactNode } from "react";

export type AlertVariant = "info" | "success" | "warning" | "error";

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  children?: ReactNode;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Alert({ variant = "info", className, children, ...props }: AlertProps) {
  return (
    <div className={cx("ui-alert", `ui-alert--${variant}`, className)} role="alert" {...props}>
      <p className="ui-alert__message">{children}</p>
    </div>
  );
}
