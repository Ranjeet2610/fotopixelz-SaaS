export type StorageProvider = "AWS_S3" | "CLOUDFLARE_R2";

export type UploadRecord = {
  id: string;
  organizationId: string;
  userId: string;
  orderId: string | null;
  originalName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageProvider: StorageProvider;
  storageKey: string;
  storageUrl: string | null;
  status: "PENDING" | "UPLOADED" | "FAILED" | "DELETED";
  createdAt: string;
  updatedAt: string;
};

export type PresignedUploadTarget = {
  provider: StorageProvider;
  method: "PUT";
  uploadUrl: string;
  storageKey: string;
  storageUrl: string;
  bucket: string;
  expiresInSeconds: number;
  headers: Record<string, string>;
};

export type PresignedUrlResult = {
  upload: UploadRecord;
  presigned: PresignedUploadTarget;
};

export type LocalUploadStatus = "queued" | "uploading" | "uploaded" | "failed";

export type LocalUploadItem = {
  localId: string;
  file: File;
  previewUrl: string | null;
  status: LocalUploadStatus;
  progress: number;
  uploadId?: string;
  error?: string;
};
