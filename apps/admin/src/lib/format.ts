import type { ApiList, ApiRecord } from "./types";

export function asList<T = ApiRecord>(value: unknown): ApiList<T> {
  if (Array.isArray(value)) {
    return { items: value as T[], total: value.length };
  }

  if (isRecord(value) && Array.isArray(value.items)) {
    return value as ApiList<T>;
  }

  return { items: [], total: 0 };
}

export function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function textValue(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

export function nestedText(record: unknown, path: string[], fallback = "-") {
  let current: unknown = record;
  for (const key of path) {
    if (!isRecord(current)) {
      return fallback;
    }
    current = current[key];
  }
  return textValue(current, fallback);
}

export function numberValue(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function dateValue(value: unknown) {
  if (!value) {
    return "-";
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatBytes(value: unknown) {
  const bytes = numberValue(value);
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function compactPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== ""),
  ) as Partial<T>;
}

export function getId(record: unknown) {
  return isRecord(record) ? textValue(record.id, "") : "";
}

export function getName(record: unknown) {
  if (!isRecord(record)) {
    return "-";
  }
  return textValue(record.name ?? record.title ?? record.fileName ?? record.email);
}
