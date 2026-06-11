"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api-client";
import { getAssetPreviewUrl, downloadDeliverable } from "@/lib/asset-client";
import { getCurrentDeliverables, toDeliverableRecords } from "@/lib/asset-gallery-adapter";
import { dateValue, textValue } from "@/lib/format";
import type { ApiRecord } from "@/lib/types";
import { DeliverableGallery } from "@repo/upload-gallery";
import { Button, TextAreaField, TextField } from "./ui";

type QaReviewPanelProps = {
  orderId: string;
  orderStatus: string;
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
  assets,
  assetsLoading,
  workflowEvents,
  onUpdated,
  onApprove,
}: QaReviewPanelProps) {
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentAssets = useMemo(() => getCurrentDeliverables(assets), [assets]);
  const currentRecords = useMemo(() => toDeliverableRecords(currentAssets), [currentAssets]);
  const currentVersion = currentRecords[0]?.version ?? 0;
  const revisionNotes = useMemo(() => parseRevisionNotes(workflowEvents), [workflowEvents]);
  const approval = useMemo(() => parseApprovalRound(workflowEvents), [workflowEvents]);
  const canReview = orderStatus === "READY_FOR_QA";

  const fetchAssetPreview = useCallback((assetId: string) => getAssetPreviewUrl(assetId), []);

  async function handleRequestRevision(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest("/orders/request-revision", {
        method: "POST",
        body: { orderId, title, comment },
      });
      setTitle("");
      setComment("");
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
          <h2 className="section-title">Revision notes</h2>
          <form className="stack-sm revision-notes-form" onSubmit={(event) => void handleRequestRevision(event)}>
            <TextField
              label="Issue title"
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              placeholder="Neck masking issue"
              required
            />
            <TextAreaField
              label="Comment"
              value={comment}
              onChange={setComment}
              placeholder="Describe what needs to be corrected."
            />
            {error ? <p className="form-error">{error}</p> : null}
            <div className="button-row">
              <Button type="button" onClick={onApprove}>
                Approve
              </Button>
              <Button type="submit" variant="secondary" disabled={submitting}>
                {submitting ? "Sending…" : "Request revision"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
