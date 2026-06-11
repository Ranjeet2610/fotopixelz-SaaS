"use client";

import { useState } from "react";
import { downloadDeliverable } from "@/lib/asset-client";
import { groupDeliverablesByVersion, toDeliverableRecords } from "@/lib/asset-gallery-adapter";
import { downloadAllSequentially } from "@/lib/upload-utils";
import { dateValue, textValue } from "@/lib/format";
import type { ApiRecord } from "@/lib/types";
import { Button } from "./ui";

type DeliverableHistoryProps = {
  assets: ApiRecord[];
  loading?: boolean;
};

export function DeliverableHistory({ assets, loading = false }: DeliverableHistoryProps) {
  const [busyVersion, setBusyVersion] = useState<number | null>(null);
  const groups = groupDeliverablesByVersion(assets);

  if (loading) {
    return <p className="upload-gallery-loading">Loading deliverable history…</p>;
  }

  if (groups.length === 0) {
    return <div className="upload-gallery-empty">No deliverables uploaded yet.</div>;
  }

  async function downloadVersion(group: (typeof groups)[number]) {
    setBusyVersion(group.version);
    try {
      const records = toDeliverableRecords(group.items);
      await downloadAllSequentially(
        records.map((record) => ({
          id: record.id,
          download: async () => {
            await downloadDeliverable(record);
          },
        })),
      );
    } finally {
      setBusyVersion(null);
    }
  }

  return (
    <div className="deliverable-history">
      {groups.map((group) => (
        <section
          className={`deliverable-version-card${group.isCurrent ? " deliverable-version-card-current" : ""}`}
          key={group.version}
        >
          <div className="deliverable-version-header">
            <div className="deliverable-version-heading">
              <h3 className="deliverable-version-title">
                Version {group.version}
                {group.isCurrent ? <span className="version-badge">CURRENT VERSION</span> : null}
              </h3>
              <dl className="deliverable-version-meta">
                <div>
                  <dt>Uploaded</dt>
                  <dd>{dateValue(group.createdAt)}</dd>
                </div>
                <div>
                  <dt>Uploader</dt>
                  <dd>{group.uploadedBy}</dd>
                </div>
                <div>
                  <dt>Review round</dt>
                  <dd>{group.reviewRound}</dd>
                </div>
                <div>
                  <dt>Files</dt>
                  <dd>{group.items.length}</dd>
                </div>
              </dl>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={busyVersion === group.version}
              onClick={() => void downloadVersion(group)}
            >
              {busyVersion === group.version ? "Downloading…" : "Download version"}
            </Button>
          </div>
          <ul className="deliverable-version-files">
            {group.items.map((item) => {
              const record = toDeliverableRecords([item])[0];
              return (
                <li key={textValue(item.id)}>
                  <span className="deliverable-file-name" title={record?.fileName ?? record?.name}>
                    {record?.fileName ?? record?.name}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void downloadDeliverable(record)}
                  >
                    Download
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
