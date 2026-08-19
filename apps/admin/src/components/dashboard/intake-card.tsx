"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { getId, numberValue, textValue } from "@/lib/format";
import type { ApiRecord } from "@/lib/types";
import { Button } from "@/components/ui";
import { Thumbnail } from "./thumbnail";
import { useOrderThumbnail } from "./use-order-thumbnail";

type IntakeCardProps = {
  order: ApiRecord;
  orderNumber: string;
  editors: ApiRecord[];
  onAssigned: () => void;
};

// Real "Assign editor" action against the existing PATCH /orders/assign-editor
// endpoint (same call orders-page.tsx already makes) — inline on the
// dashboard so the highest-priority queue never requires a page navigation
// to act on (docs/ADMIN-DASHBOARD.md §3).
export function IntakeCard({ order, orderNumber, editors, onAssigned }: IntakeCardProps) {
  const orderId = getId(order);
  const { upload } = useOrderThumbnail(orderId, "upload");
  const [editorId, setEditorId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    if (!editorId) return;
    setAssigning(true);
    setError(null);
    try {
      await apiRequest("/orders/assign-editor", { method: "PATCH", body: { orderId, editorId } });
      onAssigned();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Assignment failed");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="dash-intake-card">
      <div className="dash-intake-thumb" style={{ position: "relative" }}>
        <Thumbnail upload={upload} />
      </div>
      <div className="dash-intake-body">
        <p className="dash-intake-meta">
          {orderNumber} · {numberValue(order.totalImages)} img
        </p>
        <p className="dash-intake-title">{textValue(order.title)}</p>
        <div className="dash-intake-assign">
          <select value={editorId} onChange={(event) => setEditorId(event.target.value)} disabled={assigning}>
            <option value="">Assign to…</option>
            {editors.map((editor) => (
              <option key={getId(editor)} value={getId(editor)}>
                {textValue(editor.name ?? editor.email)}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={() => void handleAssign()} disabled={!editorId || assigning}>
            {assigning ? "…" : "Assign"}
          </Button>
        </div>
        {error ? <p className="dash-intake-meta" style={{ color: "var(--danger)" }}>{error}</p> : null}
      </div>
    </div>
  );
}
