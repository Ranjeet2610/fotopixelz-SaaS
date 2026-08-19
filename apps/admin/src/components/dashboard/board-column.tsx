import type { ReactNode } from "react";

export function BoardColumn({
  label,
  count,
  accentColor,
  children,
  emptyMessage,
}: {
  label: string;
  count: number;
  accentColor: string;
  children: ReactNode;
  emptyMessage: string;
}) {
  return (
    <div>
      <div className="dash-board-column-header">
        <span className="dash-board-column-label" style={{ color: accentColor }}>
          {label}
        </span>
        <span className="dash-board-column-count" style={{ color: accentColor }}>
          {count}
        </span>
      </div>
      {count === 0 ? <div className="dash-board-column-empty">{emptyMessage}</div> : children}
    </div>
  );
}
