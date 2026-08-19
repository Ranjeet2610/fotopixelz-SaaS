"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { isManagementRole } from "@/lib/access-control";
import { compactPayload, dateValue, getId, numberValue, textValue, toSlug } from "@/lib/format";
import type { ApiRecord } from "@/lib/types";
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
  PermissionNotice,
  SelectField,
  StatusBadge,
  SuccessBanner,
  TextAreaField,
  TextField,
} from "./ui";

type CatalogKind = "categories" | "addons";

const examples = {
  categories: "Background Removal, Ghost Mannequin, Fashion Retouching, Jewelry Retouching",
  addons: "Express Delivery, Shadow Creation, Reflection Shadow, Extra Revision",
};

export function CatalogPage({ kind }: { kind: CatalogKind }) {
  const { user } = useAuth();
  const canManage = isManagementRole(user?.role);
  const title = kind === "categories" ? "Categories" : "Addons";
  const endpoint = kind === "categories" ? "/categories" : "/addons";
  const { data, loading, error, reload } = useApiList<ApiRecord>(endpoint, { limit: 100 });
  const [editing, setEditing] = useState<ApiRecord | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function remove(id: string) {
    setActionError(null);
    setMessage(null);
    try {
      await apiRequest(`${endpoint}/${id}`, { method: "DELETE" });
      setMessage(`${title.slice(0, -1)} removed.`);
      reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Delete failed");
    }
  }

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Configuration"
        title={title}
        description={`Manage production ${kind}. Examples: ${examples[kind]}.`}
        actions={canManage ? <Button onClick={() => setEditing("new")}>Create {title.slice(0, -1).toLowerCase()}</Button> : null}
      />
      <ErrorBanner message={error ?? actionError} />
      <SuccessBanner message={message} />
      {!canManage ? <PermissionNotice /> : null}
      <Card>
        {loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={data.items}
            rowKey={(row, index) => getId(row) || String(index)}
            empty={`No ${kind} found.`}
            columns={[
              { key: "name", label: "Name", render: (row) => <strong>{textValue(row.name)}</strong> },
              { key: "slug", label: "Slug", render: (row) => textValue(row.slug) },
              { key: "description", label: "Description", render: (row) => textValue(row.description) },
              ...(kind === "addons"
                ? [
                    { key: "price", label: "Price", render: (row: ApiRecord) => numberValue(row.price).toFixed(2) },
                    { key: "pricingType", label: "Pricing", render: (row: ApiRecord) => textValue(row.pricingType, "FIXED") },
                    { key: "credits", label: "Credits", render: (row: ApiRecord) => String(numberValue(row.credits)) },
                    { key: "status", label: "Status", render: (row: ApiRecord) => <StatusBadge value={row.isActive === false ? "INACTIVE" : "ACTIVE"} /> },
                  ]
                : []),
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
                      <Button size="sm" variant="danger" onClick={() => void remove(getId(row))}>
                        Delete
                      </Button>
                    </div>
                  ) : null,
              },
            ]}
          />
        )}
      </Card>
      <CatalogModal
        kind={kind}
        endpoint={endpoint}
        value={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setMessage(`${title.slice(0, -1)} saved.`);
          reload();
        }}
        onError={setActionError}
      />
    </div>
  );
}

function CatalogModal({
  kind,
  endpoint,
  value,
  onClose,
  onSaved,
  onError,
}: {
  kind: CatalogKind;
  endpoint: string;
  value: ApiRecord | "new" | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [pricingType, setPricingType] = useState("FIXED");
  const [credits, setCredits] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const editing = value && value !== "new";

  useEffect(() => {
    if (value === "new") {
      setName("");
      setSlug("");
      setDescription("");
      setPrice("");
      setPricingType("FIXED");
      setCredits("");
    } else if (value) {
      setName(textValue(value.name, ""));
      setSlug(textValue(value.slug, ""));
      setDescription(textValue(value.description, ""));
      setPrice(value.price === undefined ? "" : textValue(value.price, ""));
      setPricingType(textValue(value.pricingType, "FIXED"));
      setCredits(value.credits === undefined ? "" : textValue(value.credits, ""));
    }
  }, [value]);

  useEffect(() => {
    if (value === "new") {
      setSlug(toSlug(name));
    }
  }, [name, value]);

  if (!value) {
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    onError(null);

    const body =
      kind === "addons"
        ? compactPayload({
            name,
            slug,
            description,
            price: price ? Number(price) : undefined,
            pricingType,
            credits: credits ? Number(credits) : undefined,
          })
        : compactPayload({ name, slug, description });

    try {
      if (editing) {
        await apiRequest(`${endpoint}/${getId(value)}`, { method: "PATCH", body });
      } else {
        await apiRequest(endpoint, { method: "POST", body });
      }
      onSaved();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(value)} title={editing ? "Edit item" : "Create item"} onClose={onClose}>
      <FormShell onSubmit={submit}>
        <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
        <TextField label="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
        <TextAreaField label="Description" value={description} onChange={setDescription} />
        {kind === "addons" ? (
          <div className="form-grid three">
            <TextField label="Price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} />
            <SelectField label="Pricing type" value={pricingType} onChange={(event) => setPricingType(event.target.value)}>
              <option value="FIXED">Fixed amount</option>
              <option value="PER_IMAGE">Per image</option>
            </SelectField>
            <TextField label="Credits" type="number" min="0" step="1" value={credits} onChange={(event) => setCredits(event.target.value)} />
          </div>
        ) : null}
        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving" : "Save"}
          </Button>
        </FormActions>
      </FormShell>
    </Modal>
  );
}
