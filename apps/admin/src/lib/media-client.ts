import { apiRequest } from "@/lib/api-client";

export async function getAssetPreviewUrl(assetId: string) {
  return apiRequest<{ downloadUrl: string; expiresIn: number }>(`/assets/${assetId}/download-url`);
}

export async function downloadSignedUrl(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.target = "_blank";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
