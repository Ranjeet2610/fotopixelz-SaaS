export type Role = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "QA" | "CLIENT";

export type ApiRecord = Record<string, unknown>;

export type ApiList<T = ApiRecord> = {
  items: T[];
  page?: number;
  limit?: number;
  total?: number;
};

export type SessionUser = {
  id: string;
  name?: string | null;
  email: string;
  role: Role;
};

export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
};

export type OrderStatus =
  | "DRAFT"
  | "UPLOADED"
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "READY_FOR_QA"
  | "REVISION_REQUIRED"
  | "APPROVED"
  | "DELIVERED"
  | "CANCELLED";

export type AssetStatus = "PENDING" | "PROCESSING" | "READY" | "DELIVERED" | "ARCHIVED";

export type UploadStatus = "PENDING" | "UPLOADED" | "FAILED" | "DELETED";

export type StorageProvider = "AWS_S3" | "CLOUDFLARE_R2";
