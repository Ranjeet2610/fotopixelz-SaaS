"use client";

import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { compactPayload, dateValue, formatBytes, getId, textValue } from "@/lib/format";
import type { ApiRecord, StorageProvider } from "@/lib/types";
import { useApiList } from "./data-hooks";
import {
  Button,
  Card,
  DataTable,
  ErrorBanner,
  FormActions,
  FormShell,
  InlineMeta,
  LoadingBlock,
  PageHeader,
  SelectField,
  StatusBadge,
  SuccessBanner,
  TextField,
} from "./ui";

const providerOptions: StorageProvider[] = ["CLOUDFLARE_R2", "AWS_S3"];

export function UploadsPage() {
  const uploads = useApiList<ApiRecord>("/uploads", { limit: 100 });
  const organizations = useApiList<ApiRecord>("/organizations", { includeInactive: false });
  const [organizationId, setOrganizationId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [provider, setProvider] = useState<StorageProvider>("CLOUDFLARE_R2");
  const [files, setFiles] = useState<File[]>([]);
  const [manual, setManual] = useState({
    originalName: "",
    fileName: "",
    mimeType: "image/jpeg",
    fileSize: "0",
    storageKey: "",
    storageUrl: "",
  });
  const [completeUploadId, setCompleteUploadId] = useState("");
  const [completeStorageKey, setCompleteStorageKey] = useState("");
  const [completeStorageUrl, setCompleteStorageUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [presigned, setPresigned] = useState<ApiRecord | null>(null);

  const organizationOptions = organizations.data.items;
  const selectedOrganizationId = organizationId || getId(organizationOptions[0]);

  useEffect(() => {
    if (!organizationId && organizationOptions.length > 0) {
      setOrganizationId(getId(organizationOptions[0]));
    }
  }, [organizationId, organizationOptions]);

  function acceptFiles(nextFiles: FileList | File[]) {
    setFiles(Array.from(nextFiles));
    setProgress(0);
    setMessage(null);
    setError(null);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    acceptFiles(event.dataTransfer.files);
  }

  async function createManualUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runUploadAction(async () => {
      await apiRequest("/uploads", {
        method: "POST",
        body: compactPayload({
          organizationId: selectedOrganizationId,
          orderId,
          originalName: manual.originalName,
          fileName: manual.fileName,
          mimeType: manual.mimeType,
          fileSize: Number(manual.fileSize),
          storageProvider: provider,
          storageKey: manual.storageKey,
          storageUrl: manual.storageUrl,
        }),
      });
      setMessage("Upload record created.");
    });
  }

  async function createBatchUploads() {
    if (files.length === 0) {
      setError("Select one or more files first.");
      return;
    }

    await runUploadAction(async () => {
      await apiRequest("/uploads/batch", {
        method: "POST",
        body: {
          organizationId: selectedOrganizationId,
          uploads: files.map((file) =>
            compactPayload({
              orderId,
              originalName: file.name,
              fileName: file.name,
              mimeType: file.type || "application/octet-stream",
              fileSize: file.size,
              storageProvider: provider,
              storageKey: `uploads/${file.name}`,
            }),
          ),
        },
      });
      setMessage(`${files.length} upload record${files.length === 1 ? "" : "s"} created.`);
    });
  }

  async function createZipUpload() {
    const zipFile = files.find((file) => file.name.toLowerCase().endsWith(".zip")) ?? files[0];
    if (!zipFile) {
      setError("Select a ZIP file first.");
      return;
    }

    await runUploadAction(async () => {
      await apiRequest("/uploads/zip", {
        method: "POST",
        body: compactPayload({
          organizationId: selectedOrganizationId,
          orderId,
          originalName: zipFile.name,
          fileName: zipFile.name,
          mimeType: "application/zip",
          fileSize: zipFile.size,
          storageProvider: provider,
          storageKey: `uploads/${zipFile.name}`,
        }),
      });
      setMessage("ZIP upload record created.");
    });
  }

  async function createPresignedUrl() {
    const file = files[0];
    if (!file) {
      setError("Select a file first.");
      return;
    }

    await runUploadAction(async () => {
      const result = await apiRequest<ApiRecord>("/uploads/presigned-url", {
        method: "POST",
        body: compactPayload({
          organizationId: selectedOrganizationId,
          orderId,
          originalName: file.name,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          storageProvider: provider,
        }),
      });
      setPresigned(result);
      setMessage("Presigned upload target prepared.");
    });
  }

  async function completeUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runUploadAction(async () => {
      await apiRequest("/uploads/complete", {
        method: "POST",
        body: compactPayload({
          uploadId: completeUploadId,
          storageKey: completeStorageKey,
          storageUrl: completeStorageUrl,
        }),
      });
      setCompleteUploadId("");
      setCompleteStorageKey("");
      setCompleteStorageUrl("");
      setMessage("Upload marked as uploaded.");
    });
  }

  async function deleteUpload(id: string) {
    await runUploadAction(async () => {
      await apiRequest(`/uploads/${id}`, { method: "DELETE" });
      setMessage("Upload deleted.");
    });
  }

  async function runUploadAction(action: () => Promise<void>) {
    setError(null);
    setMessage(null);
    setProgress(25);
    try {
      await action();
      setProgress(100);
      uploads.reload();
    } catch (caught) {
      setProgress(0);
      setError(caught instanceof Error ? caught.message : "Upload action failed");
    }
  }

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Production intake"
        title="Uploads"
        description="Create and complete upload records for images, batches, ZIP files, and provider-ready presigned flows."
      />
      <ErrorBanner message={uploads.error ?? error} />
      <SuccessBanner message={message} />

      <section className="split-grid">
        <Card>
          <h2 className="section-title">Upload files</h2>
          <div className="form-grid two">
            <SelectField label="Organization" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
              {organizationOptions.length === 0 ? <option value="">Enter organization ID below</option> : null}
              {organizationOptions.map((organization) => (
                <option value={getId(organization)} key={getId(organization)}>
                  {textValue(organization.name)}
                </option>
              ))}
            </SelectField>
            <TextField label="Organization ID" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} required />
            <TextField label="Order ID" value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Optional" />
            <SelectField label="Storage provider" value={provider} onChange={(event) => setProvider(event.target.value as StorageProvider)}>
              {providerOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
            <strong>Drop images or ZIP files here</strong>
            <span>Metadata records are created through the backend upload endpoints.</span>
            <input type="file" multiple accept="image/*,.zip,application/zip" onChange={(event) => event.target.files && acceptFiles(event.target.files)} />
          </div>
          <FilePreviewGrid files={files} />
          {progress > 0 ? (
            <div className="progress-track" aria-label="Upload progress">
              <span style={{ width: `${progress}%` }} />
            </div>
          ) : null}
          <div className="button-row">
            <Button onClick={() => void createBatchUploads()}>Create batch</Button>
            <Button variant="secondary" onClick={() => void createZipUpload()}>
              Create ZIP
            </Button>
            <Button variant="secondary" onClick={() => void createPresignedUrl()}>
              Presigned URL
            </Button>
          </div>
          {presigned ? (
            <div className="presigned-card">
              <strong>Presigned target ready</strong>
              <span>{textValue((presigned.presigned as ApiRecord | undefined)?.uploadUrl)}</span>
            </div>
          ) : null}
        </Card>

        <Card>
          <h2 className="section-title">Single upload metadata</h2>
          <FormShell onSubmit={createManualUpload}>
            <TextField label="Original name" value={manual.originalName} onChange={(event) => setManual({ ...manual, originalName: event.target.value })} required />
            <TextField label="File name" value={manual.fileName} onChange={(event) => setManual({ ...manual, fileName: event.target.value })} required />
            <TextField label="MIME type" value={manual.mimeType} onChange={(event) => setManual({ ...manual, mimeType: event.target.value })} required />
            <TextField label="File size" type="number" min="0" value={manual.fileSize} onChange={(event) => setManual({ ...manual, fileSize: event.target.value })} required />
            <TextField label="Storage key" value={manual.storageKey} onChange={(event) => setManual({ ...manual, storageKey: event.target.value })} required />
            <TextField label="Storage URL" value={manual.storageUrl} onChange={(event) => setManual({ ...manual, storageUrl: event.target.value })} placeholder="Optional" />
            <FormActions>
              <Button type="submit">Create upload</Button>
            </FormActions>
          </FormShell>
        </Card>
      </section>

      <Card>
        <h2 className="section-title">Complete upload</h2>
        <FormShell onSubmit={completeUpload}>
          <div className="form-grid three">
            <TextField label="Upload ID" value={completeUploadId} onChange={(event) => setCompleteUploadId(event.target.value)} required />
            <TextField label="Storage key" value={completeStorageKey} onChange={(event) => setCompleteStorageKey(event.target.value)} placeholder="Optional" />
            <TextField label="Storage URL" value={completeStorageUrl} onChange={(event) => setCompleteStorageUrl(event.target.value)} placeholder="Optional" />
          </div>
          <FormActions>
            <Button type="submit">Mark uploaded</Button>
          </FormActions>
        </FormShell>
      </Card>

      <Card>
        <div className="section-header">
          <h2 className="section-title">Upload records</h2>
          <Button size="sm" variant="secondary" onClick={uploads.reload}>
            Refresh
          </Button>
        </div>
        {uploads.loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={uploads.data.items}
            rowKey={(row, index) => getId(row) || String(index)}
            empty="No uploads found."
            columns={[
              { key: "file", label: "File", render: (row) => <strong>{textValue(row.originalName ?? row.fileName)}</strong> },
              { key: "size", label: "Size", render: (row) => formatBytes(row.fileSize) },
              { key: "provider", label: "Provider", render: (row) => textValue(row.storageProvider) },
              { key: "status", label: "Status", render: (row) => <StatusBadge value={textValue(row.status)} /> },
              { key: "created", label: "Created", render: (row) => dateValue(row.createdAt) },
              {
                key: "actions",
                label: "",
                render: (row) => (
                  <div className="row-actions">
                    <Button size="sm" variant="secondary" onClick={() => setCompleteUploadId(getId(row))}>
                      Complete
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void deleteUpload(getId(row))}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}

function FilePreviewGrid({ files }: { files: File[] }) {
  const [previews, setPreviews] = useState<{ file: File; url: string | null }[]>([]);

  useEffect(() => {
    const next = files.map((file) => ({
      file,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));
    setPreviews(next);

    return () => {
      next.forEach((preview) => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [files]);

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="preview-block">
      <InlineMeta>
        <span>{files.length} files selected</span>
        <span>{formatBytes(totalSize)}</span>
      </InlineMeta>
      <div className="preview-grid">
        {previews.map((preview) => (
          <div className="preview-card" key={`${preview.file.name}-${preview.file.size}`}>
            {preview.url ? <img alt="" src={preview.url} /> : <div className="zip-preview">ZIP</div>}
            <strong>{preview.file.name}</strong>
            <span>{formatBytes(preview.file.size)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
