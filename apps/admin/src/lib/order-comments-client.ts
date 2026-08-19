import { apiRequest } from "./api-client";

export type CommentType =
  | "GENERAL"
  | "REVISION"
  | "CLIENT_FEEDBACK"
  | "QA_NOTE"
  | "INTERNAL_NOTE"
  | "SYSTEM";

export type CommentStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export type OrderComment = {
  id: string;
  orderId: string;
  userId: string;
  assetId: string | null;
  parentId: string | null;
  commentType: CommentType;
  status: CommentStatus;
  body: string;
  attachmentStorageKey: string | null;
  attachmentFileName: string | null;
  attachmentMimeType: string | null;
  attachmentUrl: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string | null; email: string; role: string };
  resolvedBy?: { id: string; name: string | null; email: string; role: string } | null;
  asset?: {
    id: string;
    name: string;
    fileName: string;
    mimeType: string;
    version: number;
    reviewRound: number;
  } | null;
};

export type TimelineItem =
  | { kind: "workflow"; id: string; createdAt: string; event: Record<string, unknown> }
  | { kind: "comment"; id: string; createdAt: string; comment: OrderComment };

type ListCommentsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  commentType?: CommentType;
  status?: CommentStatus;
  assetId?: string;
};

export async function listOrderComments(orderId: string, query: ListCommentsQuery = {}) {
  const result = await apiRequest<{ items: OrderComment[]; total: number }>(
    `/order-comments/orders/${orderId}`,
    { query },
  );
  return result;
}

export async function listOrderTimeline(orderId: string) {
  const result = await apiRequest<{ items: TimelineItem[]; total: number }>(
    `/order-comments/orders/${orderId}/timeline`,
  );
  return result;
}

export async function createOrderComment(body: {
  orderId: string;
  body: string;
  commentType?: CommentType;
  assetId?: string;
  parentId?: string;
  attachmentStorageKey?: string;
  attachmentFileName?: string;
  attachmentMimeType?: string;
}) {
  return apiRequest<OrderComment>("/order-comments", { method: "POST", body });
}

export async function updateOrderComment(
  commentId: string,
  body: { body?: string; status?: CommentStatus },
) {
  return apiRequest<OrderComment>(`/order-comments/${commentId}`, { method: "PATCH", body });
}

export async function deleteOrderComment(commentId: string) {
  return apiRequest(`/order-comments/${commentId}`, { method: "DELETE" });
}

export async function getCommentAttachmentPresignedUrl(body: {
  orderId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}) {
  return apiRequest<{
    storageKey: string;
    uploadUrl: string;
    expiresIn: number;
    fileName: string;
    mimeType: string;
  }>("/order-comments/attachment/presigned-url", { method: "POST", body });
}

export async function getCommentAttachmentDownloadUrl(commentId: string) {
  return apiRequest<{ downloadUrl: string; fileName: string; mimeType: string }>(
    `/order-comments/${commentId}/attachment/download-url`,
  );
}

export async function uploadCommentAttachment(
  orderId: string,
  file: File,
  onProgress?: (percent: number) => void,
) {
  const presigned = await getCommentAttachmentPresignedUrl({
    orderId,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
  });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presigned.uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed")));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });

  return {
    attachmentStorageKey: presigned.storageKey,
    attachmentFileName: presigned.fileName,
    attachmentMimeType: presigned.mimeType,
  };
}
