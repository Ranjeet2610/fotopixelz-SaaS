"use client";

import { LazyDeliverablePreview, LazyUploadPreview } from "@repo/upload-gallery";
import { getAssetPreviewUrl } from "@/lib/asset-client";
import { getUploadPreviewUrl } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

type ThumbnailProps = {
  className?: string;
  /** Real source-upload image, when one exists for this order yet. */
  upload?: { id: string; fileName: string; mimeType: string; status: string } | null;
  /** Real deliverable image, when one exists (delivered orders). */
  asset?: { id: string; fileName: string; mimeType: string; status: string } | null;
};

// Wraps the real, presigned-URL-backed lazy preview mechanisms already used
// elsewhere in the product (packages/upload-gallery). Falls back to a
// clearly-abstract placeholder pattern only when no real asset exists yet —
// never a fabricated "customer photo" (docs/CLIENT-DASHBOARD.md §6).
export function Thumbnail({ className, upload, asset }: ThumbnailProps) {
  if (asset) {
    return (
      <div className={cn("dashboard-placeholder-thumb", className)}>
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
      <div className={cn("dashboard-placeholder-thumb", className)}>
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

  return <div className={cn("dashboard-placeholder-thumb", className)} aria-hidden />;
}
