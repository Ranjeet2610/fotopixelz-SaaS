"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { getAssetPreviewUrl, downloadDeliverable } from "@/lib/asset-client";
import { getCurrentDeliverables, toDeliverableRecords } from "@/lib/asset-gallery-adapter";
import { uploadCommentAttachment } from "@/lib/order-comments-client";
import { dateValue, textValue } from "@/lib/format";
import type { ApiRecord } from "@/lib/types";
import { DeliverableGallery } from "@repo/upload-gallery";
import { Button, SelectField, TextAreaField, TextField } from "./ui";

type QaReviewPanelProps = {
  orderId: string;
  orderStatus: string;
  deliverableVersion: number;
  reviewRound: number;
  sourceImageCount: number;
  assets: ApiRecord[];
  assetsLoading: boolean;
  workflowEvents: ApiRecord[];
  onUpdated: () => void;
  onApprove: () => void;
};

type RevisionNote = {
  round: number;
  title: string;
  comment: string;
  createdAt: string;
};

function parseRevisionNotes(events: ApiRecord[]): RevisionNote[] {
  const notes: RevisionNote[] = [];

  for (const event of events) {
    const eventType = textValue(event.eventType, "");
    const payload =
      event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
        ? (event.payload as Record<string, unknown>)
        : {};

    if (eventType === "REVISION_REQUESTED" || eventType === "QA_REVISION_REQUESTED") {
      notes.push({
        round: Number(payload.reviewRound ?? notes.length + 1),
        title: textValue(payload.title, "Revision requested"),
        comment: textValue(payload.comment, ""),
        createdAt: textValue(event.createdAt),
      });
    }
  }

  return notes.sort((left, right) => left.round - right.round);
}

function parseApprovalRound(events: ApiRecord[]) {
  const approved = events.find(
    (event) =>
      textValue(event.eventType) === "QA_APPROVED" || textValue(event.eventType) === "DELIVERY_SENT",
  );
  if (!approved) {
    return null;
  }

  return {
    createdAt: textValue(approved.createdAt),
  };
}

export function QaReviewPanel({
  orderId,
  orderStatus,
  deliverableVersion,
  reviewRound,
  sourceImageCount,
  assets,
  assetsLoading,
  workflowEvents,
  onUpdated,
  onApprove,
}: QaReviewPanelProps) {
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [assetId, setAssetId] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentAssets = useMemo(
    () => getCurrentDeliverables(assets, { deliverableVersion, reviewRound }),
    [assets, deliverableVersion, reviewRound],
  );
  const currentRecords = useMemo(() => toDeliverableRecords(currentAssets), [currentAssets]);
  const currentVersion = currentRecords[0]?.version ?? 0;
  const revisionNotes = useMemo(() => parseRevisionNotes(workflowEvents), [workflowEvents]);
  const approval = useMemo(() => parseApprovalRound(workflowEvents), [workflowEvents]);
  const canReview = orderStatus === "READY_FOR_QA";
  const deliverableCount = currentRecords.length;
  const countsMatch = sourceImageCount > 0 && deliverableCount === sourceImageCount;
  const canApprove = canReview && countsMatch;

  const fetchAssetPreview = useCallback((id: string) => getAssetPreviewUrl(id), []);

  async function handleRequestRevision(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !comment.trim()) {
      setError("Revision title and notes are required");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      let attachmentFields: Record<string, string> = {};
      if (attachment) {
        attachmentFields = await uploadCommentAttachment(orderId, attachment);
      }

      await apiRequest("/orders/request-revision", {
        method: "POST",
        body: {
          orderId,
          title: title.trim(),
          comment: comment.trim(),
          assetId: assetId || undefined,
          ...attachmentFields,
        },
      });
      setTitle("");
      setComment("");
      setAssetId("");
      setAttachment(null);
      setShowRevisionModal(false);
      onUpdated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to request revision");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack-lg qa-review-panel">
      <div>
        <h2 className="section-title">Current submission</h2>
        {currentVersion > 0 ? (
          <p className="muted-copy">
            Version {currentVersion}
            {currentRecords[0]?.uploadedBy ? ` · ${currentRecords[0].uploadedBy}` : ""}
            {currentRecords[0]?.createdAt ? ` · ${dateValue(currentRecords[0].createdAt)}` : ""}
            {currentRecords[0]?.reviewRound ? ` · Round ${currentRecords[0].reviewRound}` : ""}
          </p>
        ) : null}
        <DeliverableGallery
          deliverables={currentRecords}
          loading={assetsLoading}
          fetchPreviewUrl={fetchAssetPreview}
          downloadDeliverable={downloadDeliverable}
          emptyMessage="No current deliverables for this submission."
        />
      </div>

      <div>
        <h2 className="section-title">Revision history</h2>
        <div className="revision-timeline">
          {revisionNotes.length === 0 && !approval ? (
            <p className="muted-copy">No revision feedback yet.</p>
          ) : (
            <>
              {revisionNotes.map((note) => (
                <div className="revision-round" key={`${note.round}-${note.createdAt}`}>
                  <p className="revision-round-label">Round {note.round}</p>
                  <p className="revision-round-qa">
                    <strong>QA:</strong> {note.title}
                  </p>
                  {note.comment ? <p className="revision-round-comment">{note.comment}</p> : null}
                  <p className="revision-round-date">{dateValue(note.createdAt)}</p>
                </div>
              ))}
              {approval ? (
                <div className="revision-round revision-round-approved">
                  <p className="revision-round-label">Approved</p>
                  <p className="revision-round-qa">
                    <strong>QA approved this order</strong>
                  </p>
                  <p className="revision-round-date">{dateValue(approval.createdAt)}</p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {canReview ? (
        <div>
          <h2 className="section-title">QA actions</h2>
          <p className="muted-copy">
            Source images: {sourceImageCount} · Deliverables: {deliverableCount}
          </p>
          {!countsMatch ? (
            <p className="form-error">Source and deliverable counts do not match.</p>
          ) : null}
          <div className="button-row">
            <Button type="button" onClick={onApprove} disabled={!canApprove}>
              Approve
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowRevisionModal(true)}>
              Request revision
            </Button>
          </div>
        </div>
      ) : null}

      {showRevisionModal ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowRevisionModal(false)}>
          <div
            className="modal-card stack-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="revision-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="revision-modal-title" className="section-title">
              Request revision
            </h2>
            <p className="muted-copy">Revision notes are required before the order can return to the editor.</p>
            <form className="stack-sm revision-notes-form" onSubmit={(event) => void handleRequestRevision(event)}>
              <TextField
                label="Issue title"
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
                placeholder="Hair masking issue on image 5"
                required
              />
              <TextAreaField
                label="Comment"
                value={comment}
                onChange={setComment}
                placeholder="Describe what needs to be corrected."
              />
              {currentAssets.length > 0 ? (
                <SelectField
                  label="Link to image (optional)"
                  value={assetId}
                  onChange={(event) => setAssetId(event.currentTarget.value)}
                >
                  <option value="">Order-level revision</option>
                  {currentAssets.map((asset) => (
                    <option key={textValue(asset.id)} value={textValue(asset.id)}>
                      {textValue(asset.fileName ?? asset.name, "Image")}
                    </option>
                  ))}
                </SelectField>
              ) : null}
              <label className="field-label">
                Markup screenshot (optional)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
                />
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <div className="button-row">
                <Button type="button" variant="secondary" onClick={() => setShowRevisionModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Sending…" : "Submit revision"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
