"use client";

import Link from "next/link";
import { useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { dateValue, getId, nestedText, textValue } from "@/lib/format";
import type { ApiRecord } from "@/lib/types";
import { useApiList, useApiResource } from "./data-hooks";
import {
  Button,
  Card,
  DataTable,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  SuccessBanner,
} from "./ui";

function isImageMimeType(mimeType: string) {
  return mimeType.startsWith("image/");
}

export function AssetDetailPage({ assetId }: { assetId: string }) {
  const asset = useApiResource<ApiRecord>(`/assets/${assetId}`);
  const versions = useApiList<ApiRecord>(`/assets/${assetId}/versions`);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const mimeType = textValue(asset.data?.mimeType, "");
  const previewUrl = textValue(asset.data?.storageUrl, "");
  const orderId = textValue(asset.data?.orderId, "");
  const organizationName = nestedText(asset.data, ["order", "organization", "name"]);
  const organizationId = textValue(asset.data?.organizationId, nestedText(asset.data, ["order", "organization", "id"]));

  async function getDownloadUrl() {
    setActionError(null);
    setMessage(null);
    try {
      const result = await apiRequest<ApiRecord>(`/assets/${assetId}/download-url`);
      setDownloadUrl(textValue(result.downloadUrl, ""));
      setMessage(`Download URL ready for ${textValue(result.expiresIn, "900")} seconds.`);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Download URL request failed");
    }
  }

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Asset details"
        title={textValue(asset.data?.name ?? asset.data?.fileName, "Asset")}
        description="Review generated deliverable metadata, related workflow context, and version history."
        actions={
          <div className="button-row">
            <Button variant="secondary" onClick={() => void getDownloadUrl()}>
              Download
            </Button>
            <Link className="admin-link-button" href="/admin/assets">
              Back to assets
            </Link>
          </div>
        }
      />
      <ErrorBanner message={asset.error ?? versions.error ?? actionError} />
      <SuccessBanner message={message} />

      {asset.loading ? (
        <LoadingBlock />
      ) : (
        <section className="detail-grid">
          <Card>
            <h2 className="section-title">Overview</h2>
            <dl className="detail-list">
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge value={textValue(asset.data?.status)} />
                </dd>
              </div>
              <div>
                <dt>Order</dt>
                <dd>
                  {orderId ? (
                    <Link className="table-link" href={`/admin/orders/${orderId}`}>
                      {nestedText(asset.data, ["order", "title"], orderId)}
                    </Link>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div>
                <dt>Organization</dt>
                <dd>{organizationName || organizationId || "-"}</dd>
              </div>
              <div>
                <dt>Provider</dt>
                <dd>{textValue(asset.data?.storageProvider)}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{dateValue(asset.data?.createdAt)}</dd>
              </div>
            </dl>
            {downloadUrl ? (
              <a className="download-box" href={downloadUrl} target="_blank" rel="noreferrer">
                Open prepared download URL
              </a>
            ) : null}
          </Card>

          <Card>
            <h2 className="section-title">Preview</h2>
            <p className="large-file-name">{textValue(asset.data?.fileName)}</p>
            <p className="muted-copy">{mimeType || "MIME type assigned during upload processing"}</p>
            {previewUrl && isImageMimeType(mimeType) ? (
              <img className="asset-preview" src={previewUrl} alt={textValue(asset.data?.fileName, "Asset preview")} />
            ) : previewUrl ? (
              <a className="table-link" href={previewUrl} target="_blank" rel="noreferrer">
                Open file preview
              </a>
            ) : (
              <p className="muted-copy">Preview becomes available after upload processing completes.</p>
            )}
          </Card>
        </section>
      )}

      <Card>
        <div className="section-header">
          <h2 className="section-title">Version history</h2>
          <span className="muted-copy">Versions are created automatically from editor and QA workflow uploads.</span>
        </div>
        {versions.loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={versions.data.items}
            rowKey={(row, index) => getId(row) || String(index)}
            empty="No versions recorded yet."
            columns={[
              { key: "version", label: "Version", render: (row) => `v${textValue(row.versionNumber)}` },
              { key: "file", label: "File", render: (row) => <strong>{textValue(row.fileName)}</strong> },
              { key: "mime", label: "Type", render: (row) => textValue(row.mimeType) },
              { key: "notes", label: "Notes", render: (row) => textValue(row.notes) },
              { key: "created", label: "Created", render: (row) => dateValue(row.createdAt) },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
