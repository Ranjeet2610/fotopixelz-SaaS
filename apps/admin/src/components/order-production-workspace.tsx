"use client";

import { useCallback, useMemo, useState } from "react";
import { SourceUploadGallery } from "@repo/upload-gallery";
import { downloadUpload, getUploadPreviewUrl } from "@/lib/upload-client";
import { toSourceUploadRecords } from "@/lib/upload-gallery-adapter";
import { downloadAllSequentially } from "@/lib/upload-utils";
import {
  countCurrentReadyDeliverables,
  getNextUploadVersion,
} from "@/lib/asset-gallery-adapter";
import type { ApiRecord } from "@/lib/types";
import { DeliverableUploadPanel } from "./deliverable-upload-panel";
import { DeliverableHistory } from "./deliverable-history";
import { QaReviewPanel } from "./qa-review-panel";
import { Card } from "./ui";

const ZIP_NOTE = "ZIP packaging will be added later.";

type OrderProductionWorkspaceProps = {
  role: string | null;
  orderStatus: string;
  organizationId: string;
  orderId: string;
  deliverableVersion: number;
  reviewRound: number;
  uploads: ApiRecord[];
  uploadsLoading: boolean;
  assets: ApiRecord[];
  assetsLoading: boolean;
  workflowEvents: ApiRecord[];
  onAssetsReload: () => void;
  onWorkflowReload: () => void;
  onQaApprove: () => void;
};

function isEditorProductionStatus(status: string) {
  return status === "ASSIGNED" || status === "IN_PROGRESS" || status === "REVISION_REQUIRED";
}

function isOrderDelivered(status: string) {
  return status === "DELIVERED";
}

export function OrderProductionWorkspace({
  role,
  orderStatus,
  organizationId,
  orderId,
  deliverableVersion,
  reviewRound,
  uploads,
  uploadsLoading,
  assets,
  assetsLoading,
  workflowEvents,
  onAssetsReload,
  onWorkflowReload,
  onQaApprove,
}: OrderProductionWorkspaceProps) {
  const [sourceDownloadBusy, setSourceDownloadBusy] = useState(false);
  const delivered = isOrderDelivered(orderStatus);

  const sourceRecords = useMemo(() => toSourceUploadRecords(uploads), [uploads]);
  const uploadedSources = useMemo(
    () => sourceRecords.filter((upload) => upload.status === "UPLOADED"),
    [sourceRecords],
  );
  const nextUploadVersion = useMemo(
    () => getNextUploadVersion(assets, deliverableVersion),
    [assets, deliverableVersion],
  );

  const fetchUploadPreview = useCallback(
    (uploadId: string) => getUploadPreviewUrl(uploadId),
    [],
  );

  async function handleDownloadAllSources() {
    setSourceDownloadBusy(true);
    try {
      await downloadAllSequentially(
        uploadedSources.map((upload) => ({
          id: upload.id,
          download: async () => {
            await downloadUpload(upload);
          },
        })),
      );
    } finally {
      setSourceDownloadBusy(false);
    }
  }

  const sourceGallery = (
    <SourceUploadGallery
      uploads={sourceRecords}
      loading={uploadsLoading}
      showImageCount
      fetchPreviewUrl={fetchUploadPreview}
      downloadUpload={downloadUpload}
      onDownloadAll={handleDownloadAllSources}
      downloadAllBusy={sourceDownloadBusy}
      downloadAllNote={ZIP_NOTE}
      emptyMessage="No source images for this order."
    />
  );

  if (role === "QA") {
    return (
      <section className="stack-lg production-workflow">
        <Card>
          <h2 className="section-title">Source images</h2>
          {sourceGallery}
        </Card>
        <Card>
          <QaReviewPanel
            orderId={orderId}
            orderStatus={orderStatus}
            deliverableVersion={deliverableVersion}
            reviewRound={reviewRound}
            assets={assets}
            assetsLoading={assetsLoading}
            workflowEvents={workflowEvents}
            onUpdated={() => {
              onAssetsReload();
              onWorkflowReload();
            }}
            onApprove={onQaApprove}
          />
        </Card>
      </section>
    );
  }

  return (
    <section className="stack-lg production-workflow">
      <Card>
        <h2 className="section-title">Source images</h2>
        {sourceGallery}
      </Card>

      {role === "EDITOR" && isEditorProductionStatus(orderStatus) && !delivered ? (
        <Card>
          <h2 className="section-title">Final deliverables upload</h2>
          <p className="muted-copy upload-version-label">Upload version {nextUploadVersion}</p>
          <DeliverableUploadPanel
            organizationId={organizationId}
            orderId={orderId}
            onUploaded={onAssetsReload}
          />
        </Card>
      ) : null}

      {role === "EDITOR" || role === "ADMIN" || role === "SUPER_ADMIN" ? (
        <Card>
          <h2 className="section-title">Deliverable history</h2>
          {delivered ? (
            <p className="muted-copy">This order has been delivered. Deliverables are read-only.</p>
          ) : null}
          <DeliverableHistory assets={assets} loading={assetsLoading} />
        </Card>
      ) : null}
    </section>
  );
}

export function getReadyDeliverableCount(assets: ApiRecord[]) {
  return countCurrentReadyDeliverables(assets);
}
