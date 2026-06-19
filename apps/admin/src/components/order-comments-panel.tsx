"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getAssetPreviewUrl } from "@/lib/asset-client";
import { isManagementRole, normalizeRole } from "@/lib/access-control";
import { dateValue, textValue } from "@/lib/format";
import {
  uploadCommentAttachment,
  type CommentStatus,
  type CommentType,
  type OrderComment,
} from "@/lib/order-comments-client";
import { useOrderCommentMutations, useOrderCommentsQuery } from "@/hooks/use-order-collaboration";
import type { ApiRecord } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { Button, SelectField, TextAreaField, TextField } from "./ui";

const TYPE_LABELS: Record<CommentType, string> = {
  GENERAL: "General",
  REVISION: "Revision",
  CLIENT_FEEDBACK: "Client feedback",
  QA_NOTE: "QA note",
  INTERNAL_NOTE: "Internal",
  SYSTEM: "System",
};

type OrderCommentsPanelProps = {
  orderId: string;
  assets: ApiRecord[];
  readOnly?: boolean;
};

export function OrderCommentsPanel({ orderId, assets, readOnly = false }: OrderCommentsPanelProps) {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const canManage = isManagementRole(user?.role);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CommentStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<CommentType | "">("");

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter || undefined,
      commentType: typeFilter || undefined,
    }),
    [search, statusFilter, typeFilter],
  );

  const { items, loading, error, reload } = useOrderCommentsQuery(orderId, filters);
  const mutations = useOrderCommentMutations(orderId, reload);

  const [body, setBody] = useState("");
  const [commentType, setCommentType] = useState<CommentType>("GENERAL");
  const [assetId, setAssetId] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const allowedTypes = useMemo(() => {
    if (role === "CLIENT") return ["GENERAL", "CLIENT_FEEDBACK"] as CommentType[];
    if (role === "QA") return ["GENERAL", "QA_NOTE"] as CommentType[];
    if (canManage) return ["GENERAL", "QA_NOTE", "INTERNAL_NOTE", "CLIENT_FEEDBACK"] as CommentType[];
    if (role === "EDITOR") return ["GENERAL"] as CommentType[];
    return ["GENERAL"] as CommentType[];
  }, [role, canManage]);

  async function handleSubmit() {
    if (!body.trim()) {
      setFormError("Comment is required");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      let attachmentFields: Record<string, string> = {};
      if (attachment) {
        attachmentFields = await uploadCommentAttachment(orderId, attachment);
      }

      await mutations.create({
        orderId,
        body: body.trim(),
        commentType,
        assetId: assetId || undefined,
        ...attachmentFields,
      });

      setBody("");
      setAttachment(null);
      setAssetId("");
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(comment: OrderComment, status: CommentStatus) {
    await mutations.update(comment.id, { status });
  }

  return (
    <section className="order-comments-panel stack-lg">
      <div className="order-comments-filters">
        <TextField
          label="Search"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Search comments"
        />
        <SelectField
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as CommentStatus | "")}
        >
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="RESOLVED">Resolved</option>
        </SelectField>
        <SelectField
          label="Type"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as CommentType | "")}
        >
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
      </div>

      {loading ? <p className="muted-copy">Loading comments…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="order-comments-list">
        {items.length === 0 && !loading ? <p className="muted-copy">No comments yet.</p> : null}
        {items.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            role={role ?? "CLIENT"}
            canManage={canManage}
            readOnly={readOnly}
            onStatusChange={(status) => void handleStatusChange(comment, status)}
            onDelete={() => void mutations.remove(comment.id)}
          />
        ))}
      </div>

      {!readOnly ? (
        <div className="order-comment-compose stack-sm">
          <h3 className="section-title">Add comment</h3>
          <SelectField
            label="Type"
            value={commentType}
            onChange={(event) => setCommentType(event.target.value as CommentType)}
          >
            {allowedTypes.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </SelectField>
          {assets.length > 0 ? (
            <SelectField
              label="Link to image (optional)"
              value={assetId}
              onChange={(event) => setAssetId(event.target.value)}
            >
              <option value="">Order-level comment</option>
              {assets.map((asset) => (
                <option key={textValue(asset.id)} value={textValue(asset.id)}>
                  {textValue(asset.fileName ?? asset.name, "Image")}
                </option>
              ))}
            </SelectField>
          ) : null}
          <TextAreaField label="Message" value={body} onChange={setBody} placeholder="Write your comment…" />
          <label className="field-label">
            Markup attachment (png, jpg, webp, pdf)
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
            />
          </label>
          {formError ? <p className="form-error">{formError}</p> : null}
          <Button disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? "Posting…" : "Post comment"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function CommentCard({
  comment,
  role,
  canManage,
  readOnly,
  onStatusChange,
  onDelete,
}: {
  comment: OrderComment;
  role: string;
  canManage: boolean;
  readOnly: boolean;
  onStatusChange: (status: CommentStatus) => void;
  onDelete: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const author = comment.user?.name ?? comment.user?.email ?? "User";
  const canResolve = !readOnly && (role === "EDITOR" || role === "QA" || canManage);
  const showEditorActions = role === "EDITOR" && comment.commentType !== "SYSTEM";

  async function loadAssetPreview() {
    if (!comment.assetId || previewUrl) return;
    const result = await getAssetPreviewUrl(comment.assetId);
    setPreviewUrl(result.previewUrl);
  }

  return (
    <article className={`order-comment-card order-comment-${comment.status.toLowerCase()}`}>
      <header className="order-comment-header">
        <div className="order-comment-badges">
          <span className={`comment-type-badge comment-type-${comment.commentType.toLowerCase()}`}>
            [{comment.commentType.replaceAll("_", " ")}]
          </span>
          <span className={`comment-status-badge comment-status-${comment.status.toLowerCase()}`}>
            {comment.status.replaceAll("_", " ")}
          </span>
        </div>
        <p className="order-comment-meta">
          <strong>{author}</strong> · {dateValue(comment.createdAt)}
        </p>
      </header>

      {comment.asset ? (
        <div className="order-comment-asset">
          <button type="button" className="order-comment-asset-link" onClick={() => void loadAssetPreview()}>
            {previewUrl ? (
              <img src={previewUrl} alt="" className="order-comment-asset-thumb" />
            ) : (
              <span className="order-comment-asset-placeholder">Image</span>
            )}
          </button>
          <div>
            <p className="order-comment-asset-label">
              Linked: {comment.asset.fileName ?? comment.asset.name}
            </p>
            <Link className="table-link" href={`/admin/assets/${comment.asset.id}`}>
              Open asset
            </Link>
          </div>
        </div>
      ) : null}

      <p className="order-comment-body">{comment.body}</p>

      {comment.attachmentUrl ? (
        <p className="order-comment-attachment">
          <a className="table-link" href={comment.attachmentUrl} target="_blank" rel="noreferrer">
            View attachment: {comment.attachmentFileName ?? "file"}
          </a>
        </p>
      ) : null}

      {canResolve && comment.commentType !== "SYSTEM" ? (
        <div className="button-row">
          {showEditorActions && comment.status === "OPEN" ? (
            <Button size="sm" variant="secondary" onClick={() => onStatusChange("IN_PROGRESS")}>
              Start work
            </Button>
          ) : null}
          {showEditorActions && comment.status !== "RESOLVED" ? (
            <Button size="sm" onClick={() => onStatusChange("RESOLVED")}>
              Mark resolved
            </Button>
          ) : null}
          {canManage ? (
            <Button size="sm" variant="secondary" onClick={onDelete}>
              Delete
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
