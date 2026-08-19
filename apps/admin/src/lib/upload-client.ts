import { apiRequest } from "@/lib/api-client";
import type { SourceUploadRecord } from "@repo/upload-gallery";

export async function getUploadPreviewUrl(uploadId: string) {
  return apiRequest<{ previewUrl: string; expiresIn: number; fileName: string; mimeType: string }>(
    `/uploads/${uploadId}/preview-url`,
  );
}

// For the dashboard's board-card thumbnails: the first real uploaded source
// image for an order, if one exists yet (docs/ADMIN-DASHBOARD.md §6).
export async function listOrderUploads(orderId: string) {
  const result = await apiRequest<{ items: SourceUploadRecord[] }>("/uploads", {
    query: { orderId, limit: 1, status: "UPLOADED" },
  });
  return result.items ?? [];
}

export async function downloadUpload(upload: SourceUploadRecord) {
  const { previewUrl } = await getUploadPreviewUrl(upload.id);
  const anchor = document.createElement("a");
  anchor.href = previewUrl;
  anchor.download = upload.fileName || upload.originalName;
  anchor.rel = "noopener";
  anchor.target = "_blank";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
