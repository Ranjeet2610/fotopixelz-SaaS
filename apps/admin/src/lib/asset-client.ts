import { apiRequest } from "@/lib/api-client";
import type { DeliverableRecord } from "@repo/upload-gallery";
import { putFileWithProgress } from "@/lib/upload-utils";

type DeliverablePresignedResult = {
  asset: {
    id: string;
    fileName: string;
    name: string;
    mimeType: string;
    status: string;
  };
  presigned: {
    uploadUrl: string;
    storageKey: string;
    storageUrl: string;
    headers: Record<string, string>;
  };
};

export async function createDeliverablePresignedUrl(input: {
  organizationId: string;
  orderId: string;
  file: File;
}) {
  return apiRequest<DeliverablePresignedResult>("/assets/presigned-url", {
    method: "POST",
    body: {
      organizationId: input.organizationId,
      orderId: input.orderId,
      fileName: input.file.name,
      name: input.file.name,
      mimeType: input.file.type || "application/octet-stream",
      fileSize: input.file.size,
    },
  });
}

export async function completeDeliverableUpload(input: {
  assetId: string;
  storageKey: string;
  storageUrl: string;
}) {
  return apiRequest<DeliverablePresignedResult["asset"]>("/assets/complete", {
    method: "POST",
    body: input,
  });
}

export async function uploadDeliverableFile(input: {
  organizationId: string;
  orderId: string;
  file: File;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}) {
  const presigned = await createDeliverablePresignedUrl({
    organizationId: input.organizationId,
    orderId: input.orderId,
    file: input.file,
  });

  await putFileWithProgress(
    presigned.presigned.uploadUrl,
    input.file,
    presigned.presigned.headers,
    input.onProgress,
    input.signal,
  );

  const asset = await completeDeliverableUpload({
    assetId: presigned.asset.id,
    storageKey: presigned.presigned.storageKey,
    storageUrl: presigned.presigned.storageUrl,
  });

  return {
    ...asset,
    fileSize: input.file.size,
  };
}

export async function getAssetPreviewUrl(assetId: string) {
  const result = await apiRequest<{ downloadUrl: string }>(`/assets/${assetId}/download-url`);
  return { previewUrl: result.downloadUrl };
}

export async function downloadDeliverable(deliverable: DeliverableRecord) {
  const { previewUrl } = await getAssetPreviewUrl(deliverable.id);
  const anchor = document.createElement("a");
  anchor.href = previewUrl;
  anchor.download = deliverable.fileName || deliverable.name;
  anchor.rel = "noopener";
  anchor.target = "_blank";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export async function deleteDeliverable(assetId: string) {
  return apiRequest(`/assets/${assetId}`, { method: "DELETE" });
}
