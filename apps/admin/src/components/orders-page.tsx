"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { isManagementRole } from "@/lib/access-control";
import { compactPayload, dateValue, getId, nestedText, textValue } from "@/lib/format";
import type { ApiRecord, OrderStatus } from "@/lib/types";
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
  TextAreaField,
  TextField,
} from "./ui";

const statuses: OrderStatus[] = [
  "DRAFT",
  "UPLOADED",
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "READY_FOR_QA",
  "REVISION_REQUIRED",
  "APPROVED",
  "DELIVERED",
  "CANCELLED",
];

const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];

export function OrdersPage({ queue = false }: { queue?: boolean }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const canManage = isManagementRole(user?.role);
  const initialScope = searchParams.get("scope") ?? (user?.role === "EDITOR" ? "editor" : canManage ? "admin" : undefined);
  const [scope, setScope] = useState(initialScope ?? "");
  const [status, setStatus] = useState(queue ? "READY_FOR_QA" : "");
  const [editing, setEditing] = useState<ApiRecord | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const orders = useApiList<ApiRecord>("/orders", {
    limit: 100,
    scope: scope || undefined,
    status: status || undefined,
  });
  const organizations = useApiList<ApiRecord>("/organizations", { includeInactive: false }, canManage);
  const categories = useApiList<ApiRecord>("/categories", { limit: 100 });
  const addons = useApiList<ApiRecord>("/addons", { limit: 100 });
  const uploads = useApiList<ApiRecord>("/uploads", { limit: 100 }, canManage);
  const editors = useApiList<ApiRecord>("/admin/users/editors", { limit: 100 }, canManage);
  const qaUsers = useApiList<ApiRecord>("/admin/users/qa", { limit: 100 }, canManage);

  const title = queue ? "QA Queue" : user?.role === "EDITOR" ? "Assigned Orders" : "Orders";
  const visibleOrders = useMemo(() => {
    if (!queue) {
      return orders.data.items;
    }
    return orders.data.items.filter((order) => ["READY_FOR_QA", "REVISION_REQUIRED", "APPROVED"].includes(textValue(order.status)));
  }, [orders.data.items, queue]);

  async function updateStatus(orderId: string, nextStatus: OrderStatus) {
    await runAction(async () => {
      await apiRequest("/orders/status", { method: "PATCH", body: { orderId, status: nextStatus } });
      setMessage("Order status updated.");
    });
  }

  async function deleteOrder(orderId: string) {
    await runAction(async () => {
      await apiRequest(`/orders/${orderId}`, { method: "DELETE" });
      setMessage("Order deleted.");
    });
  }

  async function assignEditor(orderId: string, editorId: string) {
    if (!editorId) return;
    await runAction(async () => {
      await apiRequest("/orders/assign-editor", { method: "PATCH", body: { orderId, editorId } });
      setMessage("Editor assigned.");
    });
  }

  async function assignQa(orderId: string, qaId: string) {
    if (!qaId) return;
    await runAction(async () => {
      await apiRequest("/orders/assign-qa", { method: "PATCH", body: { orderId, qaId } });
      setMessage("QA assigned.");
    });
  }

  async function runAction(action: () => Promise<void>) {
    setActionError(null);
    setMessage(null);
    try {
      await action();
      orders.reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Order action failed");
    }
  }

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Workflow"
        title={title}
        description="Manage production orders, status movement, editor assignment, and QA assignment."
        actions={canManage ? <Button onClick={() => setEditing("new")}>Create order</Button> : null}
      />
      <ErrorBanner message={orders.error ?? actionError} />
      <SuccessBanner message={message} />

      <Card className="toolbar-card">
        {canManage ? (
          <SelectField label="Scope" value={scope} onChange={(event) => setScope(event.target.value)}>
            <option value="">All visible</option>
            <option value="admin">Admin</option>
            <option value="client">Client</option>
            <option value="editor">Editor</option>
          </SelectField>
        ) : null}
        <SelectField label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </SelectField>
        <Button variant="secondary" onClick={orders.reload}>
          Refresh
        </Button>
      </Card>

      <Card>
        {orders.loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={visibleOrders}
            rowKey={(row, index) => getId(row) || String(index)}
            empty="No orders found."
            columns={[
              {
                key: "order",
                label: "Order",
                render: (row) => (
                  <div>
                    <Link className="table-link" href={`/admin/orders/${getId(row)}`}>
                      {textValue(row.title)}
                    </Link>
                    <span className="muted-id">{getId(row)}</span>
                  </div>
                ),
              },
              { key: "client", label: "Client", render: (row) => nestedText(row, ["createdBy", "email"]) },
              { key: "status", label: "Status", render: (row) => <StatusBadge value={textValue(row.status)} /> },
              { key: "priority", label: "Priority", render: (row) => <StatusBadge value={textValue(row.priority)} /> },
              { key: "editor", label: "Editor", render: (row) => textValue(row.assignedEditorId) },
              { key: "qa", label: "QA", render: (row) => textValue(row.assignedQaId) },
              { key: "due", label: "Due", render: (row) => dateValue(row.dueDate ?? row.dueAt) },
              {
                key: "actions",
                label: "",
                render: (row) => (
                  <OrderRowActions
                    order={row}
                    canManage={canManage}
                    editors={editors.data.items}
                    qaUsers={qaUsers.data.items}
                    onStatus={updateStatus}
                    onAssignEditor={assignEditor}
                    onAssignQa={assignQa}
                    onEdit={() => setEditing(row)}
                    onDelete={deleteOrder}
                  />
                ),
              },
            ]}
          />
        )}
      </Card>

      <OrderModal
        value={editing}
        canManage={canManage}
        organizations={organizations.data.items}
        categories={categories.data.items}
        addons={addons.data.items}
        uploads={uploads.data.items}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setMessage("Order saved.");
          orders.reload();
        }}
        onError={setActionError}
      />
    </div>
  );
}

function OrderRowActions({
  order,
  canManage,
  editors,
  qaUsers,
  onStatus,
  onAssignEditor,
  onAssignQa,
  onEdit,
  onDelete,
}: {
  order: ApiRecord;
  canManage: boolean;
  editors: ApiRecord[];
  qaUsers: ApiRecord[];
  onStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onAssignEditor: (orderId: string, editorId: string) => Promise<void>;
  onAssignQa: (orderId: string, qaId: string) => Promise<void>;
  onEdit: () => void;
  onDelete: (orderId: string) => Promise<void>;
}) {
  const orderId = getId(order);
  return (
    <div className="row-actions row-actions-wide">
      <select className="table-select" value={textValue(order.status, "DRAFT")} onChange={(event) => void onStatus(orderId, event.target.value as OrderStatus)}>
        {statuses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      {canManage ? (
        <>
          <select className="table-select" value="" onChange={(event) => void onAssignEditor(orderId, event.target.value)}>
            <option value="">Assign editor</option>
            {editors.map((editor) => (
              <option key={getId(editor)} value={getId(editor)}>
                {textValue(editor.name ?? editor.email)}
              </option>
            ))}
          </select>
          <select className="table-select" value="" onChange={(event) => void onAssignQa(orderId, event.target.value)}>
            <option value="">Assign QA</option>
            {qaUsers.map((qa) => (
              <option key={getId(qa)} value={getId(qa)}>
                {textValue(qa.name ?? qa.email)}
              </option>
            ))}
          </select>
          <Button size="sm" variant="secondary" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => void onDelete(orderId)}>
            Delete
          </Button>
        </>
      ) : null}
    </div>
  );
}

function OrderModal({
  value,
  canManage,
  organizations,
  categories,
  addons,
  uploads,
  onClose,
  onSaved,
  onError,
}: {
  value: ApiRecord | "new" | null;
  canManage: boolean;
  organizations: ApiRecord[];
  categories: ApiRecord[];
  addons: ApiRecord[];
  uploads: ApiRecord[];
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string | null) => void;
}) {
  const [form, setForm] = useState({
    organizationId: "",
    categoryId: "",
    title: "",
    instructions: "",
    totalImages: "0",
    creditsUsed: "0",
    totalAmount: "",
    priority: "NORMAL",
    dueDate: "",
  });
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedUploadIds, setSelectedUploadIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const editing = value && value !== "new";

  useEffect(() => {
    if (value === "new") {
      setForm({
        organizationId: getId(organizations[0]),
        categoryId: "",
        title: "",
        instructions: "",
        totalImages: "0",
        creditsUsed: "0",
        totalAmount: "",
        priority: "NORMAL",
        dueDate: "",
      });
      setSelectedAddonIds([]);
      setSelectedUploadIds([]);
    } else if (value) {
      setForm({
        organizationId: textValue(value.organizationId, ""),
        categoryId: textValue(value.categoryId, ""),
        title: textValue(value.title, ""),
        instructions: textValue(value.instructions, ""),
        totalImages: textValue(value.totalImages, "0"),
        creditsUsed: textValue(value.creditsUsed, "0"),
        totalAmount: textValue(value.totalAmount, ""),
        priority: textValue(value.priority, "NORMAL"),
        dueDate: value.dueDate ? new Date(String(value.dueDate)).toISOString().slice(0, 16) : "",
      });
      setSelectedAddonIds([]);
      setSelectedUploadIds([]);
    }
  }, [value, organizations]);

  if (!value || !canManage) {
    return null;
  }

  function update(key: keyof typeof form, next: string) {
    setForm((current) => ({ ...current, [key]: next }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    onError(null);

    const body = compactPayload({
      organizationId: form.organizationId,
      categoryId: form.categoryId,
      title: form.title,
      instructions: form.instructions,
      totalImages: Number(form.totalImages),
      creditsUsed: Number(form.creditsUsed),
      totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
      priority: form.priority,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
    });

    try {
      if (editing) {
        const { organizationId: _organizationId, ...updateBody } = body;
        void _organizationId;
        await apiRequest(`/orders/${getId(value)}`, { method: "PATCH", body: updateBody });
      } else {
        await apiRequest("/orders", { method: "POST", body });
      }
      onSaved();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Order save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(value)} title={editing ? "Edit order" : "Create order"} onClose={onClose}>
      <FormShell onSubmit={submit}>
        <div className="form-grid two">
          <SelectField label="Organization" value={form.organizationId} onChange={(event) => update("organizationId", event.target.value)} disabled={Boolean(editing)}>
            {organizations.map((organization) => (
              <option value={getId(organization)} key={getId(organization)}>
                {textValue(organization.name)}
              </option>
            ))}
          </SelectField>
          <SelectField label="Category" value={form.categoryId} onChange={(event) => update("categoryId", event.target.value)}>
            <option value="">No category</option>
            {categories.map((category) => (
              <option value={getId(category)} key={getId(category)}>
                {textValue(category.name)}
              </option>
            ))}
          </SelectField>
        </div>
        <TextField label="Title" value={form.title} onChange={(event) => update("title", event.target.value)} required />
        <TextAreaField label="Instructions" value={form.instructions} onChange={(value) => update("instructions", value)} />
        <div className="form-grid two">
          <SelectField
            label="Addons"
            multiple
            value={selectedAddonIds}
            onChange={(event) => setSelectedAddonIds(Array.from(event.target.selectedOptions).map((option) => option.value))}
          >
            {addons.map((addon) => (
              <option value={getId(addon)} key={getId(addon)}>
                {textValue(addon.name)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Uploads"
            multiple
            value={selectedUploadIds}
            onChange={(event) => setSelectedUploadIds(Array.from(event.target.selectedOptions).map((option) => option.value))}
          >
            {uploads.map((upload) => (
              <option value={getId(upload)} key={getId(upload)}>
                {textValue(upload.originalName ?? upload.fileName)}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="form-grid three">
          <TextField label="Total images" type="number" min="0" value={form.totalImages} onChange={(event) => update("totalImages", event.target.value)} />
          <TextField label="Credits used" type="number" min="0" value={form.creditsUsed} onChange={(event) => update("creditsUsed", event.target.value)} />
          <TextField label="Total amount" type="number" min="0" step="0.01" value={form.totalAmount} onChange={(event) => update("totalAmount", event.target.value)} />
        </div>
        <div className="form-grid two">
          <SelectField label="Priority" value={form.priority} onChange={(event) => update("priority", event.target.value)}>
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </SelectField>
          <TextField label="Due date" type="datetime-local" value={form.dueDate} onChange={(event) => update("dueDate", event.target.value)} />
        </div>
        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving" : "Save order"}
          </Button>
        </FormActions>
      </FormShell>
    </Modal>
  );
}
