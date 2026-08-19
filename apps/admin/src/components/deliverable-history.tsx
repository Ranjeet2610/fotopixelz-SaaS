"use client";

import { useRef, useState } from "react";
import { deleteDeliverable, downloadDeliverable, uploadDeliverableFile } from "@/lib/asset-client";
import {
  getCurrentDeliverables,
  groupDeliverablesByVersion,
  toDeliverableRecords,
} from "@/lib/asset-gallery-adapter";
import { downloadAllSequentially } from "@/lib/upload-utils";
import { dateValue, textValue } from "@/lib/format";
import type { ApiRecord } from "@/lib/types";
import { Button } from "./ui";

type DeliverableHistoryProps = {
  assets: ApiRecord[];
  loading?: boolean;
  canManage?: boolean;
  organizationId?: string;
  orderId?: string;
  deliverableVersion?: number;
  reviewRound?: number;
  onChanged?: () => void;
};

export function DeliverableHistory({
  assets,
  loading = false,
  canManage = false,
  organizationId,
  orderId,
  deliverableVersion = 0,
  reviewRound = 1,
  onChanged,
}: DeliverableHistoryProps) {
  const [busyVersion, setBusyVersion] = useState<number | null>(null);
  const [busyAssetId, setBusyAssetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replaceAssetId, setReplaceAssetId] = useState<string | null>(null);
  const groups = groupDeliverablesByVersion(assets);
  const currentBatchAssets = getCurrentDeliverables(assets, { deliverableVersion, reviewRound });

  if (loading) {
    return <p className="upload-gallery-loading">Loading deliverable history…</p>;
  }

  if (groups.length === 0) {
    return <div className="upload-gallery-empty">No deliverables uploaded yet.</div>;
  }

  async function downloadVersion(group: (typeof groups)[number]) {
    setBusyVersion(group.version);
    try {
      const records = toDeliverableRecords(group.items);
      await downloadAllSequentially(
        records.map((record) => ({
          id: record.id,
          download: async () => {
            await downloadDeliverable(record);
          },
        })),
      );
    } finally {
      setBusyVersion(null);
    }
  }

  async function handleRemove(assetId: string) {
    setBusyAssetId(assetId);
    setError(null);
    try {
      await deleteDeliverable(assetId);
      onChanged?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to remove deliverable");
    } finally {
      setBusyAssetId(null);
    }
  }

  function startReplace(assetId: string) {
    setReplaceAssetId(assetId);
    replaceInputRef.current?.click();
  }

  async function handleReplaceFileSelected(file: File | undefined) {
    if (!file || !replaceAssetId || !organizationId || !orderId) {
      setReplaceAssetId(null);
      return;
    }

    const assetId = replaceAssetId;
    setReplaceAssetId(null);
    setBusyAssetId(assetId);
    setError(null);

    try {
      await uploadDeliverableFile({
        organizationId,
        orderId,
        file,
        replacesAssetId: assetId,
        onPresignedCreated: onChanged,
      });
      onChanged?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to replace deliverable");
    } finally {
      setBusyAssetId(null);
      if (replaceInputRef.current) {
        replaceInputRef.current.value = "";
      }
    }
  }

  function canManageAsset(assetId: string) {
    return canManage && currentBatchAssets.some((asset) => textValue(asset.id) === assetId);
  }

  return (
    <div className="deliverable-history">
      <input
        ref={replaceInputRef}
        type="file"
        className="sr-only"
        accept="image/*,.tif,.tiff"
        onChange={(event) => void handleReplaceFileSelected(event.target.files?.[0])}
      />

      {error ? <p className="form-error">{error}</p> : null}

      {groups.map((group) => (
        <section
          className={`deliverable-version-card${group.isCurrent ? " deliverable-version-card-current" : ""}`}
          key={group.version}
        >
          <div className="deliverable-version-header">
            <div className="deliverable-version-heading">
              <h3 className="deliverable-version-title">
                Version {group.version}
                {group.isCurrent ? <span className="version-badge">CURRENT VERSION</span> : null}
              </h3>
              <dl className="deliverable-version-meta">
                <div>
                  <dt>Uploaded</dt>
                  <dd>{dateValue(group.createdAt)}</dd>
                </div>
                <div>
                  <dt>Uploader</dt>
                  <dd>{group.uploadedBy}</dd>
                </div>
                <div>
                  <dt>Review round</dt>
                  <dd>{group.reviewRound}</dd>
                </div>
                <div>
                  <dt>Files</dt>
                  <dd>{group.items.length}</dd>
                </div>
              </dl>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={busyVersion === group.version}
              onClick={() => void downloadVersion(group)}
            >
              {busyVersion === group.version ? "Downloading…" : "Download version"}
            </Button>
          </div>
          <ul className="deliverable-version-files">
            {group.items.map((item) => {
              const record = toDeliverableRecords([item])[0];
              const assetId = textValue(item.id);
              const manageable = canManageAsset(assetId);
              return (
                <li key={assetId}>
                  <span className="deliverable-file-name" title={record?.fileName ?? record?.name}>
                    {record?.fileName ?? record?.name}
                  </span>
                  <div className="button-row">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void downloadDeliverable(record)}
                    >
                      Download
                    </Button>
                    {manageable ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyAssetId === assetId}
                          onClick={() => void handleRemove(assetId)}
                        >
                          {busyAssetId === assetId ? "Removing…" : "Remove"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyAssetId === assetId}
                          onClick={() => startReplace(assetId)}
                        >
                          Replace
                        </Button>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
