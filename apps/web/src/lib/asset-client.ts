import { apiRequest } from "@/lib/api-client";
import type { AssetDownload, AssetRecord, PaginatedAssets } from "@/lib/asset-types";

export async function listAssets(query: {
  organizationId?: string;
  orderId?: string;
  limit?: number;
}) {
  return apiRequest<PaginatedAssets>("/assets", { query });
}

export async function listOrderDeliverables(orderId: string) {
  const result = await apiRequest<PaginatedAssets>("/assets", {
    query: { orderId, limit: 100, isCurrent: "true", status: "DELIVERED" },
  });
  return result.items ?? [];
}

export async function getAssetDownloadUrl(assetId: string) {
  return apiRequest<AssetDownload>(`/assets/${assetId}/download-url`);
}

export async function downloadAsset(asset: AssetRecord) {
  const { downloadUrl } = await getAssetDownloadUrl(asset.id);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = asset.fileName || asset.name;
  anchor.rel = "noopener";
  anchor.target = "_blank";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export async function downloadAllAssets(assets: AssetRecord[]) {
  for (const asset of assets) {
    await downloadAsset(asset);
  }
}

export function estimateAssetFileSize(asset: AssetRecord) {
  void asset;
  return null as number | null;
}
