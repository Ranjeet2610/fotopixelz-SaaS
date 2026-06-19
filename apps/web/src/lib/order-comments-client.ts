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
  body: string;
  commentType: CommentType;
  status: CommentStatus;
  assetId: string | null;
  attachmentUrl: string | null;
  attachmentFileName: string | null;
  createdAt: string;
  user?: { name: string | null; email: string };
  asset?: { id: string; fileName: string; name: string } | null;
};

export async function listOrderComments(orderId: string) {
  return apiRequest<{ items: OrderComment[]; total: number }>(`/order-comments/orders/${orderId}`, {
    query: { limit: 100 },
  });
}

export async function createOrderComment(body: {
  orderId: string;
  body: string;
  commentType?: CommentType;
  assetId?: string;
  attachmentStorageKey?: string;
  attachmentFileName?: string;
  attachmentMimeType?: string;
}) {
  return apiRequest<OrderComment>("/order-comments", { method: "POST", body });
}

export async function uploadCommentAttachment(orderId: string, file: File) {
  const presigned = await apiRequest<{
    storageKey: string;
    uploadUrl: string;
    fileName: string;
    mimeType: string;
  }>("/order-comments/attachment/presigned-url", {
    method: "POST",
    body: {
      orderId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
    },
  });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presigned.uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
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
