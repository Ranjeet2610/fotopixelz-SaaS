"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { isManagementRole, normalizeRole } from "@/lib/access-control";
import { compactPayload, dateValue, getId, nestedText, numberValue, textValue } from "@/lib/format";
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
  "SUBMITTED",
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

const manualStatuses = statuses.filter((status) => status !== "REVISION_REQUIRED");

const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];

type LineItemDraft = {
  key: string;
  serviceId: string;
  quantity: string;
  unitPrice: string;
};

function createLineItemDraft(serviceId = ""): LineItemDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    serviceId,
    quantity: "1",
    unitPrice: "",
  };
}

function lineItemUnitPrice(item: LineItemDraft, services: ApiRecord[]) {
  if (item.unitPrice) {
    return Number(item.unitPrice);
  }
  const service = services.find((entry) => getId(entry) === item.serviceId);
  return numberValue(service?.basePrice);
}

function lineItemSubtotal(item: LineItemDraft, services: ApiRecord[]) {
  const quantity = Number(item.quantity) || 0;
  return quantity * lineItemUnitPrice(item, services);
}

function addonLineSubtotal(addon: ApiRecord, imageCount: number) {
  if (textValue(addon.pricingType) === "PER_IMAGE") {
    return numberValue(addon.price) * imageCount;
  }
  return numberValue(addon.price);
}

function displayOrderNumber(row: ApiRecord) {
  const orderNumber = textValue(row.orderNumber);
  if (orderNumber) {
    return orderNumber;
  }
  return getId(row).slice(-8).toUpperCase();
}

function staffLabel(staff: ApiRecord[], staffId: string) {
  if (!staffId) {
    return "-";
  }

  const match = staff.find((entry) => getId(entry) === staffId);
  return match ? textValue(match.name ?? match.email) : staffId;
}

export function OrdersPage({ queue = false }: { queue?: boolean }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const role = normalizeRole(user?.role);
  const canManage = isManagementRole(user?.role);
  const isEditor = role === "EDITOR";
  const isQa = role === "QA";
  const initialScope = searchParams.get("scope") ?? (canManage ? "admin" : undefined);
  const [scope, setScope] = useState(initialScope ?? "");
  const [status, setStatus] = useState(queue ? "" : canManage ? "PENDING" : "");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ApiRecord | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const orders = useApiList<ApiRecord>("/orders", {
    limit: 100,
    scope: scope || undefined,
    status: status || undefined,
    search: search.trim() || undefined,
  });
  const organizations = useApiList<ApiRecord>("/organizations", { includeInactive: false }, canManage);
  const categories = useApiList<ApiRecord>("/categories", { limit: 100 });
  const addons = useApiList<ApiRecord>("/addons", { limit: 100 });
  const uploads = useApiList<ApiRecord>("/uploads", { limit: 100 }, canManage);
  const editors = useApiList<ApiRecord>("/admin/users/editors", { limit: 100 }, canManage);
  const qaUsers = useApiList<ApiRecord>("/admin/users/qa", { limit: 100 }, canManage);

  const title = queue ? "QA Queue" : isEditor ? "Assigned Orders" : canManage ? "Order Queue" : "Orders";
  const visibleOrders = useMemo(() => {
    if (!queue) {
      return orders.data.items;
    }
    if (isQa && !status) {
      return orders.data.items;
    }
    return orders.data.items.filter((order) =>
      ["READY_FOR_QA", "REVISION_REQUIRED", "APPROVED"].includes(textValue(order.status)),
    );
  }, [isQa, orders.data.items, queue, status]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const order of orders.data.items) {
      const key = textValue(order.status, "UNKNOWN");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [orders.data.items]);

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
        description="Monitor client orders, assign editors and QA, and move production status through the workflow."
      />
      <ErrorBanner message={orders.error ?? actionError} />
      <SuccessBanner message={message} />

      {queue ? (
        <Card className="qa-queue-debug">
          <p className="page-eyebrow">Temporary debug</p>
          <h2 className="section-title">QA queue diagnostics</h2>
          <dl className="detail-list qa-queue-debug-list">
            <div>
              <dt>Logged-in QA user</dt>
              <dd>
                {user?.email ?? "—"} <span className="muted-id">({user?.id ?? "no id"})</span>
              </dd>
            </div>
            <div>
              <dt>API status filter</dt>
              <dd>
                {status || "none (server inbox: READY_FOR_QA, REVISION_REQUIRED, DELIVERED)"}
              </dd>
            </div>
            <div>
              <dt>Server filter</dt>
              <dd>assignedQaId must equal logged-in QA user id</dd>
            </div>
            <div>
              <dt>Fetched / visible</dt>
              <dd>
                {orders.data.items.length} fetched · {visibleOrders.length} visible in table
              </dd>
            </div>
          </dl>
          <div className="qa-queue-status-counts">
            <p className="muted-copy">Order count per status (from API response):</p>
            {statusCounts.length === 0 ? (
              <p className="muted-copy">No orders returned.</p>
            ) : (
              <ul>
                {statusCounts.map(([orderStatus, count]) => (
                  <li key={orderStatus}>
                    <strong>{orderStatus}</strong>: {count}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      ) : null}

      <Card className="toolbar-card">
        {canManage ? (
          <SelectField label="Scope" value={scope} onChange={(event) => setScope(event.target.value)}>
            <option value="">Production queue</option>
            <option value="admin">Admin</option>
            <option value="client">Client</option>
            <option value="editor">Editor</option>
          </SelectField>
        ) : null}
        {!isEditor ? (
          <SelectField label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">{queue ? "QA inbox (default)" : "All statuses"}</option>
            {statuses.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </SelectField>
        ) : null}
        {canManage ? (
          <TextField
            label="Search"
            placeholder="Order number or title"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        ) : null}
        <Button variant="secondary" onClick={orders.reload}>
          Refresh
        </Button>
      </Card>

      {canManage && !queue ? (
        <Card className="support-panel">
          <p className="page-eyebrow">Support</p>
          <h2 className="section-title">Advanced actions</h2>
          <p className="muted-copy">
            Orders are normally created from the client dashboard. Use this only when you need to create an order on
            behalf of a client.
          </p>
          <div className="button-row">
            <Button variant="secondary" onClick={() => setEditing("new")}>
              Create Order On Behalf Of Client
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        {orders.loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={visibleOrders}
            rowKey={(row, index) => getId(row) || String(index)}
            empty="No orders found."
            columns={
              queue
                ? [
                    {
                      key: "order",
                      label: "Order",
                      render: (row) => (
                        <div>
                          <Link className="table-link" href={`/admin/orders/${getId(row)}`}>
                            {textValue(row.title)}
                          </Link>
                          <span className="muted-id">#{displayOrderNumber(row)}</span>
                        </div>
                      ),
                    },
                    { key: "status", label: "Status", render: (row) => <StatusBadge value={textValue(row.status)} /> },
                    {
                      key: "assignedQa",
                      label: "Assigned QA",
                      render: (row) => {
                        const assignedQaId = textValue(row.assignedQaId, "");
                        const matches = assignedQaId && assignedQaId === user?.id;
                        return (
                          <div>
                            <span>{staffLabel(qaUsers.data.items, assignedQaId)}</span>
                            <span className="muted-id">
                              {assignedQaId || "not assigned"}
                              {assignedQaId ? (matches ? " · matches you" : " · different QA") : ""}
                            </span>
                          </div>
                        );
                      },
                    },
                    { key: "client", label: "Client", render: (row) => nestedText(row, ["createdBy", "email"]) },
                    { key: "due", label: "Due", render: (row) => dateValue(row.dueDate ?? row.dueAt) },
                    {
                      key: "actions",
                      label: "",
                      render: (row) => (
                        <OrderRowActions
                          order={row}
                          userRole={role}
                          canManage={false}
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
                  ]
                : isEditor
                ? [
                    {
                      key: "order",
                      label: "Order",
                      render: (row) => (
                        <div>
                          <Link className="table-link" href={`/admin/orders/${getId(row)}`}>
                            #{displayOrderNumber(row)}
                          </Link>
                          <span className="muted-id">{textValue(row.title)}</span>
                        </div>
                      ),
                    },
                    { key: "client", label: "Client", render: (row) => nestedText(row, ["createdBy", "email"]) },
                    {
                      key: "images",
                      label: "Uploaded images",
                      render: (row) => String(numberValue(row.totalImages)),
                    },
                    { key: "due", label: "Due date", render: (row) => dateValue(row.dueDate ?? row.dueAt) },
                    { key: "status", label: "Status", render: (row) => <StatusBadge value={textValue(row.status)} /> },
                    {
                      key: "actions",
                      label: "",
                      render: (row) => (
                        <OrderRowActions
                          order={row}
                          userRole={role}
                          canManage={false}
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
                  ]
                : [
                    {
                      key: "order",
                      label: "Order",
                      render: (row) => (
                        <div>
                          <Link className="table-link" href={`/admin/orders/${getId(row)}`}>
                            {textValue(row.title)}
                          </Link>
                          <span className="muted-id">#{displayOrderNumber(row)}</span>
                        </div>
                      ),
                    },
                    { key: "client", label: "Client", render: (row) => nestedText(row, ["createdBy", "email"]) },
                    { key: "status", label: "Status", render: (row) => <StatusBadge value={textValue(row.status)} /> },
                    {
                      key: "images",
                      label: "Images",
                      render: (row) => String(numberValue(row.totalImages)),
                    },
                    {
                      key: "editor",
                      label: "Editor",
                      render: (row) => staffLabel(editors.data.items, textValue(row.assignedEditorId)),
                    },
                    {
                      key: "qa",
                      label: "QA",
                      render: (row) => staffLabel(qaUsers.data.items, textValue(row.assignedQaId)),
                    },
                    { key: "due", label: "Due", render: (row) => dateValue(row.dueDate ?? row.dueAt) },
                    {
                      key: "actions",
                      label: "",
                      render: (row) => (
                        <OrderRowActions
                          order={row}
                          userRole={role}
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
                  ]
            }
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
  userRole,
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
  userRole: ReturnType<typeof normalizeRole>;
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
  const currentStatus = textValue(order.status, "DRAFT") as OrderStatus;

  if (userRole === "EDITOR") {
    return (
      <div className="row-actions row-actions-wide">
        <Link className="admin-link-button" href={`/admin/orders/${orderId}`}>
          Open
        </Link>
        {currentStatus === "ASSIGNED" ? (
          <Button size="sm" onClick={() => void onStatus(orderId, "IN_PROGRESS")}>
            Start work
          </Button>
        ) : null}
        {currentStatus === "IN_PROGRESS" || currentStatus === "REVISION_REQUIRED" ? (
          <Button size="sm" onClick={() => void onStatus(orderId, "READY_FOR_QA")}>
            Mark ready for QA
          </Button>
        ) : null}
      </div>
    );
  }

  if (userRole === "QA") {
    return (
      <div className="row-actions row-actions-wide">
        <Link className="admin-link-button" href={`/admin/orders/${orderId}`}>
          Open
        </Link>
        {currentStatus === "READY_FOR_QA" ? (
          <Link className="admin-link-button" href={`/admin/orders/${orderId}`}>
            Review in order detail
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="row-actions row-actions-wide">
      {canManage ? (
        <>
          <select
            className="table-select"
            value={textValue(order.assignedEditorId)}
            onChange={(event) => void onAssignEditor(orderId, event.target.value)}
          >
            <option value="">Assign editor</option>
            {editors.map((editor) => (
              <option key={getId(editor)} value={getId(editor)}>
                {textValue(editor.name ?? editor.email)}
              </option>
            ))}
          </select>
          <select
            className="table-select"
            value={textValue(order.assignedQaId)}
            onChange={(event) => void onAssignQa(orderId, event.target.value)}
          >
            <option value="">Assign QA</option>
            {qaUsers.map((qa) => (
              <option key={getId(qa)} value={getId(qa)}>
                {textValue(qa.name ?? qa.email)}
              </option>
            ))}
          </select>
          <select
            className="table-select"
            value={currentStatus}
            onChange={(event) => void onStatus(orderId, event.target.value as OrderStatus)}
          >
            {currentStatus === "REVISION_REQUIRED" ? (
              <option value={currentStatus} disabled>
                {currentStatus}
              </option>
            ) : null}
            {manualStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
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
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const editing = value && value !== "new";
  const canEditItems =
    !editing || textValue(value?.status) === "DRAFT" || textValue(value?.status) === "SUBMITTED";
  const services = useApiList<ApiRecord>(
    "/services",
    { organizationId: form.organizationId || undefined, limit: 100 },
    Boolean(form.organizationId),
  );

  const totalImageCount = useMemo(
    () => lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [lineItems],
  );

  const lineItemsTotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + lineItemSubtotal(item, services.data.items), 0),
    [lineItems, services.data.items],
  );

  const addonsSubtotal = useMemo(
    () =>
      selectedAddonIds.reduce((sum, addonId) => {
        const addon = addons.find((entry) => getId(entry) === addonId);
        return addon ? sum + addonLineSubtotal(addon, totalImageCount) : sum;
      }, 0),
    [selectedAddonIds, addons, totalImageCount],
  );

  const estimatedTotal = lineItemsTotal + addonsSubtotal;
  const hasCatalogLines = lineItems.some((item) => item.serviceId) || selectedAddonIds.length > 0;

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
      setLineItems([]);
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
      const existingAddons = Array.isArray(value.addons) ? value.addons : [];
      setSelectedAddonIds(
        existingAddons.map((addon) => textValue(addon.addonId, nestedText(addon, ["addon", "id"], ""))),
      );
      setSelectedUploadIds([]);
      const existingItems = Array.isArray(value.items) ? value.items : [];
      setLineItems(
        existingItems.map((item) => ({
          key: getId(item) || createLineItemDraft().key,
          serviceId: textValue(item.serviceId, nestedText(item, ["service", "id"], "")),
          quantity: textValue(item.quantity, "1"),
          unitPrice: item.unitPrice === undefined ? "" : textValue(item.unitPrice, ""),
        })),
      );
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

    const items = lineItems
      .filter((item) => item.serviceId)
      .map((item) =>
        compactPayload({
          serviceId: item.serviceId,
          quantity: Number(item.quantity) || 1,
          unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined,
        }),
      );

    const addonLines = selectedAddonIds.map((addonId) => ({ addonId }));

    const body = compactPayload({
      organizationId: form.organizationId,
      categoryId: form.categoryId,
      title: form.title,
      instructions: form.instructions,
      totalImages: hasCatalogLines ? undefined : Number(form.totalImages),
      creditsUsed: hasCatalogLines ? undefined : Number(form.creditsUsed),
      totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
      priority: form.priority,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      items: !editing ? (items.length > 0 ? items : undefined) : canEditItems ? items : undefined,
      addons: !editing
        ? addonLines.length > 0
          ? addonLines
          : undefined
        : canEditItems
          ? addonLines
          : undefined,
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
    <Modal
      open={Boolean(value)}
      title={editing ? "Edit order" : "Create Order On Behalf Of Client"}
      onClose={onClose}
    >
      <FormShell onSubmit={submit}>
        {!editing ? (
          <p className="muted-copy">
            Support-only flow. Client accounts should create orders from their dashboard under normal operations.
          </p>
        ) : null}
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

        <div className="stack-lg">
          <div className="inline-meta">
            <strong>Services</strong>
            {canEditItems ? (
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => setLineItems((current) => [...current, createLineItemDraft()])}
              >
                Add service
              </Button>
            ) : (
              <span className="muted-copy">Line items are locked after draft.</span>
            )}
          </div>
          {lineItems.length === 0 ? (
            <p className="muted-copy">No services added. Legacy orders can still use manual totals below.</p>
          ) : (
            <div className="stack-lg">
              {lineItems.map((item, index) => (
                <div className="form-grid three" key={item.key}>
                  <SelectField
                    label="Service"
                    value={item.serviceId}
                    disabled={!canEditItems}
                    onChange={(event) =>
                      setLineItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, serviceId: event.target.value, unitPrice: "" } : entry,
                        ),
                      )
                    }
                  >
                    <option value="">Select service</option>
                    {services.data.items.map((service) => (
                      <option value={getId(service)} key={getId(service)}>
                        {textValue(service.name)} ({numberValue(service.basePrice).toFixed(2)})
                      </option>
                    ))}
                  </SelectField>
                  <TextField
                    label="Images"
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    disabled={!canEditItems}
                    onChange={(event) =>
                      setLineItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, quantity: event.target.value } : entry,
                        ),
                      )
                    }
                  />
                  <TextField
                    label="Unit price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Service price"
                    value={item.unitPrice}
                    disabled={!canEditItems}
                    onChange={(event) =>
                      setLineItems((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, unitPrice: event.target.value } : entry,
                        ),
                      )
                    }
                  />
                  <div className="form-actions">
                    <span>Subtotal: {lineItemSubtotal(item, services.data.items).toFixed(2)}</span>
                    {canEditItems ? (
                      <Button
                        size="sm"
                        variant="danger"
                        type="button"
                        onClick={() => setLineItems((current) => current.filter((_, entryIndex) => entryIndex !== index))}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              <p className="muted-copy">
                Services subtotal: {lineItemsTotal.toFixed(2)} ({totalImageCount} image{totalImageCount === 1 ? "" : "s"})
              </p>
            </div>
          )}
        </div>

        <div className="form-grid two">
          <SelectField
            label="Addons"
            multiple
            value={selectedAddonIds}
            onChange={(event) => setSelectedAddonIds(Array.from(event.target.selectedOptions).map((option) => option.value))}
          >
            {addons.map((addon) => (
              <option value={getId(addon)} key={getId(addon)}>
                {textValue(addon.name)} ({textValue(addon.pricingType, "FIXED")} · {numberValue(addon.price).toFixed(2)})
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
        {selectedAddonIds.length > 0 ? (
          <p className="muted-copy">Addons subtotal: {addonsSubtotal.toFixed(2)}</p>
        ) : null}
        {hasCatalogLines ? (
          <p className="muted-copy">Estimated order total: {estimatedTotal.toFixed(2)}</p>
        ) : null}
        <div className="form-grid three">
          <TextField
            label="Total images"
            type="number"
            min="0"
            value={hasCatalogLines ? String(totalImageCount) : form.totalImages}
            onChange={(event) => update("totalImages", event.target.value)}
            disabled={hasCatalogLines}
          />
          <TextField
            label="Credits used"
            type="number"
            min="0"
            value={form.creditsUsed}
            onChange={(event) => update("creditsUsed", event.target.value)}
            disabled={hasCatalogLines}
          />
          <TextField
            label="Total amount (admin override)"
            type="number"
            min="0"
            step="0.01"
            placeholder={hasCatalogLines ? estimatedTotal.toFixed(2) : undefined}
            value={form.totalAmount}
            onChange={(event) => update("totalAmount", event.target.value)}
          />
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
