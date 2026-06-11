"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { isManagementRole } from "@/lib/access-control";
import { compactPayload, dateValue, getId, nestedText, numberValue, textValue, toSlug } from "@/lib/format";
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

export function ServicesPage() {
  const { user } = useAuth();
  const canManage = isManagementRole(user?.role);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [organizationFilter, setOrganizationFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editing, setEditing] = useState<ApiRecord | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const listQuery = useMemo(
    () => ({
      limit: 100,
      includeInactive: statusFilter !== "ACTIVE",
      ...(search.trim() ? { q: search.trim() } : {}),
      ...(categoryFilter !== "ALL" ? { categoryId: categoryFilter } : {}),
      ...(organizationFilter !== "ALL" ? { organizationId: organizationFilter } : {}),
    }),
    [search, categoryFilter, organizationFilter, statusFilter],
  );

  const { data, loading, error, reload } = useApiList<ApiRecord>("/services", listQuery, canManage);
  const { data: categories } = useApiList<ApiRecord>("/categories", { limit: 100 }, canManage);
  const { data: organizations } = useApiList<ApiRecord>(
    "/organizations",
    { includeInactive: true, limit: 100 },
    canManage,
  );

  const rows = useMemo(() => {
    if (statusFilter !== "INACTIVE") {
      return data.items;
    }
    return data.items.filter((item) => item.isActive === false);
  }, [data.items, statusFilter]);

  async function toggleActive(row: ApiRecord) {
    const id = getId(row);
    const isActive = row.isActive !== false;
    setActionError(null);
    setMessage(null);

    try {
      if (isActive) {
        await apiRequest(`/services/${id}`, { method: "DELETE" });
        setMessage("Service deactivated.");
      } else {
        await apiRequest(`/services/${id}`, { method: "PATCH", body: { isActive: true } });
        setMessage("Service activated.");
      }
      reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Service update failed");
    }
  }

  if (!canManage) {
    return <PermissionNotice />;
  }

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Catalog"
        title="Services"
        description="Manage production services, pricing, and availability by category and organization."
        actions={<Button onClick={() => setEditing("new")}>Create service</Button>}
      />

      <ErrorBanner message={error ?? actionError} />
      <SuccessBanner message={message} />

      <Card className="toolbar-card">
        <TextField
          label="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Service name"
        />
        <SelectField label="Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="ALL">All categories</option>
          {categories.items.map((category) => (
            <option key={getId(category)} value={getId(category)}>
              {textValue(category.name)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Organization"
          value={organizationFilter}
          onChange={(event) => setOrganizationFilter(event.target.value)}
        >
          <option value="ALL">All organizations</option>
          {organizations.items.map((organization) => (
            <option key={getId(organization)} value={getId(organization)}>
              {textValue(organization.name)}
            </option>
          ))}
        </SelectField>
        <SelectField label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </SelectField>
        <Button variant="secondary" onClick={reload}>
          Refresh
        </Button>
      </Card>

      <Card>
        {loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(row, index) => getId(row) || String(index)}
            empty="No services found."
            columns={[
              { key: "name", label: "Name", render: (row) => <strong>{textValue(row.name)}</strong> },
              { key: "category", label: "Category", render: (row) => nestedText(row, ["category", "name"]) },
              {
                key: "organization",
                label: "Organization",
                render: (row) => (row.organization ? nestedText(row, ["organization", "name"]) : "Global"),
              },
              { key: "basePrice", label: "Base Price", render: (row) => numberValue(row.basePrice).toFixed(2) },
              {
                key: "status",
                label: "Status",
                render: (row) => <StatusBadge value={row.isActive === false ? "INACTIVE" : "ACTIVE"} />,
              },
              { key: "created", label: "Created", render: (row) => dateValue(row.createdAt) },
              {
                key: "actions",
                label: "",
                render: (row) => (
                  <div className="row-actions">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(row)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={row.isActive === false ? "primary" : "danger"}
                      onClick={() => void toggleActive(row)}
                    >
                      {row.isActive === false ? "Activate" : "Deactivate"}
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      <ServiceModal
        value={editing}
        categories={categories.items}
        organizations={organizations.items}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setMessage("Service saved.");
          reload();
        }}
        onError={setActionError}
      />
    </div>
  );
}

function ServiceModal({
  value,
  categories,
  organizations,
  onClose,
  onSaved,
  onError,
}: {
  value: ApiRecord | "new" | null;
  categories: ApiRecord[];
  organizations: ApiRecord[];
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const editing = value && value !== "new";

  useEffect(() => {
    if (value === "new") {
      setName("");
      setSlug("");
      setCategoryId(categories[0] ? getId(categories[0]) : "");
      setOrganizationId("");
      setBasePrice("");
      setDescription("");
      setIsActive(true);
    } else if (value) {
      setName(textValue(value.name, ""));
      setSlug(textValue(value.slug, ""));
      setCategoryId(textValue(value.categoryId, nestedText(value, ["category", "id"], "")));
      setOrganizationId(value.organizationId ? textValue(value.organizationId, "") : "");
      setBasePrice(value.basePrice === undefined ? "" : textValue(value.basePrice, ""));
      setDescription(textValue(value.description, ""));
      setIsActive(value.isActive !== false);
    }
  }, [value, categories]);

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

    const body = compactPayload({
      name,
      slug,
      categoryId,
      organizationId: organizationId || null,
      description,
      basePrice: basePrice ? Number(basePrice) : undefined,
      isActive,
    });

    try {
      if (editing) {
        await apiRequest(`/services/${getId(value)}`, { method: "PATCH", body });
      } else {
        await apiRequest("/services", { method: "POST", body });
      }
      onSaved();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Service save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(value)} title={editing ? "Edit service" : "Create service"} onClose={onClose}>
      <FormShell onSubmit={submit}>
        <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
        <TextField label="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
        <SelectField label="Category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={getId(category)} value={getId(category)}>
              {textValue(category.name)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Organization"
          value={organizationId}
          onChange={(event) => setOrganizationId(event.target.value)}
        >
          <option value="">Global (no organization)</option>
          {organizations.map((organization) => (
            <option key={getId(organization)} value={getId(organization)}>
              {textValue(organization.name)}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Base Price"
          type="number"
          min="0"
          step="0.01"
          value={basePrice}
          onChange={(event) => setBasePrice(event.target.value)}
        />
        <TextAreaField label="Description" value={description} onChange={setDescription} />
        <SelectField label="Status" value={isActive ? "ACTIVE" : "INACTIVE"} onChange={(event) => setIsActive(event.target.value === "ACTIVE")}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </SelectField>
        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !categoryId}>
            {submitting ? "Saving" : "Save service"}
          </Button>
        </FormActions>
      </FormShell>
    </Modal>
  );
}
