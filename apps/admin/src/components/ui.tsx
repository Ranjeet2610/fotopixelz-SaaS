"use client";

import type { ButtonHTMLAttributes, FormEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
};

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`admin-btn admin-btn-${variant} admin-btn-${size} ${className}`}
      type={props.type ?? "button"}
      {...props}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`admin-card ${className}`}>{children}</section>;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
}: {
  columns: { key: string; label: string; render: (row: T) => ReactNode }[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty?: string;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr key={rowKey(row, index)}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="empty-cell" colSpan={columns.length}>
                {empty ?? "No records found."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-panel" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <Button aria-label="Close dialog" size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function StatusBadge({ value }: { value?: string | null }) {
  const normalized = (value ?? "UNKNOWN").toUpperCase();
  return <span className={`status-badge status-${normalized.toLowerCase().replaceAll("_", "-")}`}>{normalized}</span>;
}

export function RoleBadge({ value }: { value?: string | null }) {
  return <span className="role-badge">{value ?? "UNKNOWN"}</span>;
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }
  return <div className="notice notice-error">{message}</div>;
}

export function SuccessBanner({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }
  return <div className="notice notice-success">{message}</div>;
}

export function PermissionNotice() {
  return (
    <Card className="permission-card">
      <p className="page-eyebrow">Access restricted</p>
      <h2>You do not have permission</h2>
      <p>This area is limited by your Fotopixelz operations role.</p>
    </Card>
  );
}

export function TextField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <textarea value={value} rows={rows} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="form-actions">{children}</div>;
}

export function FormShell({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      {children}
    </form>
  );
}

export function InlineMeta({ children }: { children: ReactNode }) {
  return <div className="inline-meta">{children}</div>;
}

export function LoadingBlock({ label = "Loading data" }: { label?: string }) {
  return <div className="loading-block">{label}...</div>;
}
