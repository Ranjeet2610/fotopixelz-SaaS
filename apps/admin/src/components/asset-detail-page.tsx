"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { compactPayload, dateValue, getId, textValue } from "@/lib/format";
import type { ApiRecord, StorageProvider } from "@/lib/types";
import { useApiList, useApiResource } from "./data-hooks";
import {
  Button,
  Card,
  DataTable,
  ErrorBanner,
  FormActions,
  FormShell,
  LoadingBlock,
  Modal,
  PageHeader,
  SelectField,
  StatusBadge,
  SuccessBanner,
  TextAreaField,
  TextField,
} from "./ui";

const versionProviders: StorageProvider[] = ["CLOUDFLARE_R2", "AWS_S3"];

export function AssetDetailPage({ assetId }: { assetId: string }) {
  const asset = useApiResource<ApiRecord>(`/assets/${assetId}`);
  const versions = useApiList<ApiRecord>(`/assets/${assetId}/versions`);
  const [editingVersion, setEditingVersion] = useState<ApiRecord | "new" | null>(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  async function deleteVersion(versionId: string) {
    setActionError(null);
    setMessage(null);
    try {
      await apiRequest(`/assets/${assetId}/versions/${versionId}`, { method: "DELETE" });
      setMessage("Version deleted.");
      versions.reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Version delete failed");
    }
  }

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Asset details"
        title={textValue(asset.data?.name ?? asset.data?.fileName, "Asset")}
        description={assetId}
        actions={
          <div className="button-row">
            <Button variant="secondary" onClick={() => void getDownloadUrl()}>
              Download URL
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
                <dd>{textValue(asset.data?.orderId)}</dd>
              </div>
              <div>
                <dt>Provider</dt>
                <dd>{textValue(asset.data?.storageProvider)}</dd>
              </div>
              <div>
                <dt>Storage key</dt>
                <dd>{textValue(asset.data?.storageKey)}</dd>
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
            <h2 className="section-title">Current file</h2>
            <p className="large-file-name">{textValue(asset.data?.fileName)}</p>
            <p className="muted-copy">{textValue(asset.data?.mimeType)}</p>
          </Card>
        </section>
      )}

      <Card>
        <div className="section-header">
          <h2 className="section-title">Version history</h2>
          <Button size="sm" onClick={() => setEditingVersion("new")}>
            Add version
          </Button>
        </div>
        {versions.loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={versions.data.items}
            rowKey={(row, index) => getId(row) || String(index)}
            empty="No versions found."
            columns={[
              { key: "version", label: "Version", render: (row) => `v${textValue(row.versionNumber)}` },
              { key: "file", label: "File", render: (row) => <strong>{textValue(row.fileName)}</strong> },
              { key: "notes", label: "Notes", render: (row) => textValue(row.notes) },
              { key: "created", label: "Created", render: (row) => dateValue(row.createdAt) },
              {
                key: "actions",
                label: "",
                render: (row) => (
                  <div className="row-actions">
                    <Button size="sm" variant="secondary" onClick={() => setEditingVersion(row)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void deleteVersion(getId(row))}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      <VersionModal
        value={editingVersion}
        assetId={assetId}
        onClose={() => setEditingVersion(null)}
        onSaved={() => {
          setEditingVersion(null);
          setMessage("Version saved.");
          versions.reload();
        }}
        onError={setActionError}
      />
    </div>
  );
}

function VersionModal({
  value,
  assetId,
  onClose,
  onSaved,
  onError,
}: {
  value: ApiRecord | "new" | null;
  assetId: string;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string | null) => void;
}) {
  const [form, setForm] = useState({
    fileName: "",
    mimeType: "image/jpeg",
    storageProvider: "CLOUDFLARE_R2",
    storageKey: "",
    storageUrl: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const editing = value && value !== "new";

  useEffect(() => {
    if (value === "new") {
      setForm({
        fileName: "",
        mimeType: "image/jpeg",
        storageProvider: "CLOUDFLARE_R2",
        storageKey: "",
        storageUrl: "",
        notes: "",
      });
    } else if (value) {
      setForm({
        fileName: textValue(value.fileName, ""),
        mimeType: textValue(value.mimeType, "image/jpeg"),
        storageProvider: textValue(value.storageProvider, "CLOUDFLARE_R2"),
        storageKey: textValue(value.storageKey, ""),
        storageUrl: textValue(value.storageUrl, ""),
        notes: textValue(value.notes, ""),
      });
    }
  }, [value]);

  if (!value) {
    return null;
  }

  function update(key: keyof typeof form, next: string) {
    setForm((current) => ({ ...current, [key]: next }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    onError(null);

    try {
      if (editing) {
        await apiRequest(`/assets/${assetId}/versions/${getId(value)}`, {
          method: "PATCH",
          body: compactPayload(form),
        });
      } else {
        await apiRequest(`/assets/${assetId}/versions`, {
          method: "POST",
          body: compactPayload(form),
        });
      }
      onSaved();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Version save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(value)} title={editing ? "Edit version" : "Add version"} onClose={onClose}>
      <FormShell onSubmit={submit}>
        <TextField label="File name" value={form.fileName} onChange={(event) => update("fileName", event.target.value)} required />
        <TextField label="MIME type" value={form.mimeType} onChange={(event) => update("mimeType", event.target.value)} required />
        <SelectField label="Provider" value={form.storageProvider} onChange={(event) => update("storageProvider", event.target.value)}>
          {versionProviders.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </SelectField>
        <TextField label="Storage key" value={form.storageKey} onChange={(event) => update("storageKey", event.target.value)} required />
        <TextField label="Storage URL" value={form.storageUrl} onChange={(event) => update("storageUrl", event.target.value)} />
        <TextAreaField label="Notes" value={form.notes} onChange={(value) => update("notes", value)} />
        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving" : "Save version"}
          </Button>
        </FormActions>
      </FormShell>
    </Modal>
  );
}
