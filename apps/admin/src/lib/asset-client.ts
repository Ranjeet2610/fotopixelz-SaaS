import { apiRequest } from "@/lib/api-client";
import type { DeliverableRecord } from "@repo/upload-gallery";
import { triggerFileDownload } from "@/lib/download-utils";
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
  replacesAssetId?: string;
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
      ...(input.replacesAssetId ? { replacesAssetId: input.replacesAssetId } : {}),
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
  replacesAssetId?: string;
  onProgress?: (progress: number) => void;
  onPresignedCreated?: () => void;
  signal?: AbortSignal;
}) {
  let createdAssetId: string | undefined;

  try {
    const presigned = await createDeliverablePresignedUrl({
      organizationId: input.organizationId,
      orderId: input.orderId,
      file: input.file,
      replacesAssetId: input.replacesAssetId,
    });

    createdAssetId = presigned.asset.id;
    input.onPresignedCreated?.();

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
  } catch (error) {
    if (createdAssetId) {
      try {
        await deleteDeliverable(createdAssetId);
      } catch {
        // Best-effort cleanup of the PENDING row created for this attempt.
      }
    }
    throw error;
  }
}

export async function getAssetPreviewUrl(assetId: string) {
  const result = await apiRequest<{ downloadUrl: string }>(`/assets/${assetId}/download-url`);
  return { previewUrl: result.downloadUrl };
}

export async function downloadDeliverable(deliverable: DeliverableRecord) {
  const result = await apiRequest<{ downloadUrl: string }>(
    `/assets/${deliverable.id}/download-url`,
    { query: { download: "true" } },
  );
  await triggerFileDownload(result.downloadUrl, deliverable.fileName || deliverable.name);
}

export async function deleteDeliverable(assetId: string) {
  return apiRequest(`/assets/${assetId}`, { method: "DELETE" });
}
