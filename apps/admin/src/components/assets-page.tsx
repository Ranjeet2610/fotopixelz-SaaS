"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { isManagementRole } from "@/lib/access-control";
import { compactPayload, dateValue, getId, nestedText, textValue } from "@/lib/format";
import type { ApiRecord, AssetStatus, StorageProvider } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { useApiList } from "./data-hooks";
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
  TextField,
} from "./ui";

const assetStatuses: AssetStatus[] = ["PENDING", "PROCESSING", "READY", "DELIVERED", "ARCHIVED"];
const providers: StorageProvider[] = ["CLOUDFLARE_R2", "AWS_S3"];

export function AssetsPage() {
  const { user } = useAuth();
  const canManage = isManagementRole(user?.role);
  const assets = useApiList<ApiRecord>("/assets", { limit: 100 });
  const organizations = useApiList<ApiRecord>("/organizations", { includeInactive: false }, canManage);
  const orders = useApiList<ApiRecord>("/orders", { limit: 100 }, canManage);
  const uploads = useApiList<ApiRecord>("/uploads", { limit: 100 }, canManage);
  const [editing, setEditing] = useState<ApiRecord | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function deleteAsset(assetId: string) {
    setActionError(null);
    setMessage(null);
    try {
      await apiRequest(`/assets/${assetId}`, { method: "DELETE" });
      setMessage("Asset archived.");
      assets.reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Asset delete failed");
    }
  }

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Production output"
        title="Assets"
        description="Manage working and deliverable files attached to orders."
        actions={canManage ? <Button onClick={() => setEditing("new")}>Create asset</Button> : null}
      />
      <ErrorBanner message={assets.error ?? actionError} />
      <SuccessBanner message={message} />

      <Card>
        {assets.loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={assets.data.items}
            rowKey={(row, index) => getId(row) || String(index)}
            empty="No assets found."
            columns={[
              {
                key: "asset",
                label: "Asset",
                render: (row) => (
                  <div>
                    <Link className="table-link" href={`/admin/assets/${getId(row)}`}>
                      {textValue(row.name ?? row.fileName)}
                    </Link>
                    <span className="muted-id">{getId(row)}</span>
                  </div>
                ),
              },
              { key: "order", label: "Order", render: (row) => nestedText(row, ["order", "title"]) },
              { key: "provider", label: "Provider", render: (row) => textValue(row.storageProvider) },
              { key: "status", label: "Status", render: (row) => <StatusBadge value={textValue(row.status)} /> },
              { key: "created", label: "Created", render: (row) => dateValue(row.createdAt) },
              {
                key: "actions",
                label: "",
                render: (row) =>
                  canManage ? (
                    <div className="row-actions">
                      <Button size="sm" variant="secondary" onClick={() => setEditing(row)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => void deleteAsset(getId(row))}>
                        Archive
                      </Button>
                    </div>
                  ) : null,
              },
            ]}
          />
        )}
      </Card>

      <AssetModal
        value={editing}
        organizations={organizations.data.items}
        orders={orders.data.items}
        uploads={uploads.data.items}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setMessage("Asset saved.");
          assets.reload();
        }}
        onError={setActionError}
      />
    </div>
  );
}

function AssetModal({
  value,
  organizations,
  orders,
  uploads,
  onClose,
  onSaved,
  onError,
}: {
  value: ApiRecord | "new" | null;
  organizations: ApiRecord[];
  orders: ApiRecord[];
  uploads: ApiRecord[];
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string | null) => void;
}) {
  const [form, setForm] = useState({
    organizationId: "",
    orderId: "",
    uploadId: "",
    name: "",
    fileName: "",
    mimeType: "image/jpeg",
    storageProvider: "CLOUDFLARE_R2",
    storageKey: "",
    storageUrl: "",
    status: "PENDING",
  });
  const [submitting, setSubmitting] = useState(false);
  const editing = value && value !== "new";

  useEffect(() => {
    if (value === "new") {
      setForm({
        organizationId: getId(organizations[0]),
        orderId: getId(orders[0]),
        uploadId: "",
        name: "",
        fileName: "",
        mimeType: "image/jpeg",
        storageProvider: "CLOUDFLARE_R2",
        storageKey: "",
        storageUrl: "",
        status: "PENDING",
      });
    } else if (value) {
      setForm({
        organizationId: textValue(value.organizationId, ""),
        orderId: textValue(value.orderId, ""),
        uploadId: textValue(value.uploadId, ""),
        name: textValue(value.name, ""),
        fileName: textValue(value.fileName, ""),
        mimeType: textValue(value.mimeType, "image/jpeg"),
        storageProvider: textValue(value.storageProvider, "CLOUDFLARE_R2"),
        storageKey: textValue(value.storageKey, ""),
        storageUrl: textValue(value.storageUrl, ""),
        status: textValue(value.status, "PENDING"),
      });
    }
  }, [value, organizations, orders]);

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
        await apiRequest(`/assets/${getId(value)}`, {
          method: "PATCH",
          body: compactPayload({
            name: form.name,
            status: form.status,
            storageKey: form.storageKey,
            storageUrl: form.storageUrl,
          }),
        });
      } else {
        await apiRequest("/assets", {
          method: "POST",
          body: compactPayload({
            organizationId: form.organizationId,
            orderId: form.orderId,
            uploadId: form.uploadId,
            name: form.name,
            fileName: form.fileName,
            mimeType: form.mimeType,
            storageProvider: form.storageProvider,
            storageKey: form.storageKey,
            storageUrl: form.storageUrl,
            status: form.status,
          }),
        });
      }
      onSaved();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Asset save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(value)} title={editing ? "Edit asset" : "Create asset"} onClose={onClose}>
      <FormShell onSubmit={submit}>
        {!editing ? (
          <div className="form-grid two">
            <SelectField label="Organization" value={form.organizationId} onChange={(event) => update("organizationId", event.target.value)}>
              {organizations.map((organization) => (
                <option key={getId(organization)} value={getId(organization)}>
                  {textValue(organization.name)}
                </option>
              ))}
            </SelectField>
            <SelectField label="Order" value={form.orderId} onChange={(event) => update("orderId", event.target.value)}>
              {orders.map((order) => (
                <option key={getId(order)} value={getId(order)}>
                  {textValue(order.title)}
                </option>
              ))}
            </SelectField>
          </div>
        ) : null}
        <TextField label="Name" value={form.name} onChange={(event) => update("name", event.target.value)} required />
        {!editing ? (
          <>
            <TextField label="File name" value={form.fileName} onChange={(event) => update("fileName", event.target.value)} required />
            <TextField label="MIME type" value={form.mimeType} onChange={(event) => update("mimeType", event.target.value)} required />
            <SelectField label="Upload" value={form.uploadId} onChange={(event) => update("uploadId", event.target.value)}>
              <option value="">No source upload</option>
              {uploads.map((upload) => (
                <option key={getId(upload)} value={getId(upload)}>
                  {textValue(upload.originalName ?? upload.fileName)}
                </option>
              ))}
            </SelectField>
          </>
        ) : null}
        <div className="form-grid two">
          <SelectField label="Provider" value={form.storageProvider} onChange={(event) => update("storageProvider", event.target.value)}>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </SelectField>
          <SelectField label="Status" value={form.status} onChange={(event) => update("status", event.target.value)}>
            {assetStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectField>
        </div>
        <TextField label="Storage key" value={form.storageKey} onChange={(event) => update("storageKey", event.target.value)} required />
        <TextField label="Storage URL" value={form.storageUrl} onChange={(event) => update("storageUrl", event.target.value)} placeholder="Optional" />
        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving" : "Save asset"}
          </Button>
        </FormActions>
      </FormShell>
    </Modal>
  );
}
