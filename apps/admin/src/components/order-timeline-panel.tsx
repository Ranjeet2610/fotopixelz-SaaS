"use client";

import { dateValue, nestedText, textValue } from "@/lib/format";
import { describeWorkflowEvent } from "@/lib/workflow-events";
import { useOrderTimelineQuery } from "@/hooks/use-order-collaboration";
import type { OrderComment } from "@/lib/order-comments-client";

const COMMENT_TYPE_LABELS: Record<string, string> = {
  GENERAL: "Comment posted",
  REVISION: "Revision requested",
  CLIENT_FEEDBACK: "Client feedback",
  QA_NOTE: "QA note",
  INTERNAL_NOTE: "Internal note",
  SYSTEM: "System",
};

export function OrderTimelinePanel({ orderId }: { orderId: string }) {
  const { items, loading, error } = useOrderTimelineQuery(orderId);

  if (loading) {
    return <p className="muted-copy">Loading activity timeline…</p>;
  }

  if (error) {
    return <p className="form-error">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="muted-copy">No activity recorded yet.</p>;
  }

  return (
    <div className="order-timeline">
      {items.map((item) => {
        if (item.kind === "workflow") {
          const payload =
            item.event.payload && typeof item.event.payload === "object"
              ? (item.event.payload as Record<string, unknown>)
              : undefined;

          return (
            <div className="order-timeline-item order-timeline-workflow" key={`workflow-${item.id}`}>
              <span className="order-timeline-dot" />
              <div>
                <strong>{describeWorkflowEvent(textValue(item.event.eventType), payload)}</strong>
                <p className="muted-copy">
                  {dateValue(item.event.createdAt)} · {nestedText(item.event, ["actor", "email"]) || "System"}
                </p>
              </div>
            </div>
          );
        }

        const comment = item.comment as OrderComment;
        const author = comment.user?.name ?? comment.user?.email ?? "User";

        return (
          <div className="order-timeline-item order-timeline-comment" key={`comment-${item.id}`}>
            <span className="order-timeline-dot" />
            <div>
              <strong>
                {COMMENT_TYPE_LABELS[comment.commentType] ?? "Comment"} — {author}
              </strong>
              <p className="order-timeline-comment-body">{comment.body}</p>
              <p className="muted-copy">
                {dateValue(comment.createdAt)} · {comment.status.replaceAll("_", " ")}
                {comment.asset ? ` · ${comment.asset.fileName ?? comment.asset.name}` : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
