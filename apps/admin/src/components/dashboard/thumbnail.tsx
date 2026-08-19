"use client";

import { LazyDeliverablePreview, LazyUploadPreview } from "@repo/upload-gallery";
import { getAssetPreviewUrl } from "@/lib/asset-client";
import { getUploadPreviewUrl } from "@/lib/upload-client";

type ThumbnailProps = {
  className?: string;
  /** Real source-upload image, when one exists for this order yet. */
  upload?: { id: string; fileName: string; mimeType: string; status: string } | null;
  /** Real deliverable image, when one exists (delivered orders). */
  asset?: { id: string; fileName: string; mimeType: string; status: string } | null;
};

// Wraps the real, presigned-URL-backed lazy preview mechanisms already used
// by @repo/upload-gallery (getUploadPreviewUrl/getAssetPreviewUrl already
// exist in apps/admin/src/lib). Falls back to a clearly-abstract placeholder
// only when no real asset exists yet (docs/ADMIN-DASHBOARD.md §6).
export function Thumbnail({ className, upload, asset }: ThumbnailProps) {
  const cls = `dashboard-placeholder-thumb${className ? ` ${className}` : ""}`;

  if (asset) {
    return (
      <div className={cls}>
        <LazyDeliverablePreview
          assetId={asset.id}
          fileName={asset.fileName}
          mimeType={asset.mimeType}
          status={asset.status}
          className="h-full w-full object-cover"
          fetchPreviewUrl={getAssetPreviewUrl}
        />
      </div>
    );
  }

  if (upload) {
    return (
      <div className={cls}>
        <LazyUploadPreview
          uploadId={upload.id}
          fileName={upload.fileName}
          mimeType={upload.mimeType}
          status={upload.status}
          className="h-full w-full object-cover"
          fetchPreviewUrl={getUploadPreviewUrl}
        />
      </div>
    );
  }

  return <div className={cls} aria-hidden />;
}
