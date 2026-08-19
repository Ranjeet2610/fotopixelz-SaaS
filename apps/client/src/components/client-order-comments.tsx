"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createOrderComment,
  listOrderComments,
  uploadCommentAttachment,
  type OrderComment,
} from "@/lib/order-comments-client";

type ClientOrderCommentsProps = {
  orderId: string;
  readOnly?: boolean;
};

export function ClientOrderComments({ orderId, readOnly = false }: ClientOrderCommentsProps) {
  const [items, setItems] = useState<OrderComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listOrderComments(orderId);
      setItems(result.items);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleSubmit() {
    if (!body.trim()) {
      setError("Please enter your feedback");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      let attachmentFields = {};
      if (attachment) {
        attachmentFields = await uploadCommentAttachment(orderId, attachment);
      }

      await createOrderComment({
        orderId,
        body: body.trim(),
        commentType: "CLIENT_FEEDBACK",
        ...attachmentFields,
      });
      setBody("");
      setAttachment(null);
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to send feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border-t border-border pt-5">
      <div>
        <h2 className="text-[13px] font-semibold">Production communication</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Feedback shared with the production team, and their response.
        </p>
      </div>

      {loading ? <p className="mt-4 text-sm text-muted-foreground">Loading comments…</p> : null}

      <div className="mt-4 space-y-3">
        {items.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : null}
        {items.map((comment) => (
          <article key={comment.id} className="rounded-lg border border-border p-3.5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium">
                  {comment.user?.name ?? comment.user?.email}
                </span>
                <Badge status="neutral" showDot={false}>
                  {comment.commentType.replaceAll("_", " ")}
                </Badge>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap">{comment.body}</p>
            {comment.asset ? (
              <p className="mt-2 text-xs text-muted-foreground">Linked image: {comment.asset.fileName}</p>
            ) : null}
            {comment.attachmentUrl ? (
              <a className="mt-2 inline-block text-xs underline" href={comment.attachmentUrl} target="_blank" rel="noreferrer">
                View reference: {comment.attachmentFileName}
              </a>
            ) : null}
            <div className="mt-2">
              <Badge status="neutral" showDot={false}>
                {comment.status.replaceAll("_", " ")}
              </Badge>
            </div>
          </article>
        ))}
      </div>

      {!readOnly ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Your feedback</span>
            <textarea
              className="min-h-24 rounded-md border border-input px-3 py-2"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Describe changes or reference images…"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Reference file (optional)</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="button"
            className="bg-brand text-brand-foreground hover:bg-brand/90"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? "Sending…" : "Send feedback"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
