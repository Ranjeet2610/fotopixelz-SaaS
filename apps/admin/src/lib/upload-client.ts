import { apiRequest } from "@/lib/api-client";
import type { SourceUploadRecord } from "@repo/upload-gallery";

export async function getUploadPreviewUrl(uploadId: string) {
  return apiRequest<{ previewUrl: string; expiresIn: number; fileName: string; mimeType: string }>(
    `/uploads/${uploadId}/preview-url`,
  );
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
