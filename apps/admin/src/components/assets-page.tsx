"use client";

import Link from "next/link";
import { useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { isManagementRole } from "@/lib/access-control";
import { dateValue, getId, nestedText, textValue } from "@/lib/format";
import type { ApiRecord } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { useApiList } from "./data-hooks";
import {
  Button,
  Card,
  DataTable,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  SuccessBanner,
} from "./ui";

export function AssetsPage() {
  const { user } = useAuth();
  const canManage = isManagementRole(user?.role);
  const assets = useApiList<ApiRecord>("/assets", { limit: 100 });
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function archiveAsset(assetId: string) {
    setActionError(null);
    setMessage(null);
    try {
      await apiRequest(`/assets/${assetId}`, { method: "DELETE" });
      setMessage("Asset archived.");
      assets.reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Asset archive failed");
    }
  }

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Production output"
        title="Assets"
        description="Review deliverables created automatically from editor uploads, QA approvals, and final delivery."
      />
      <ErrorBanner message={assets.error ?? actionError} />
      <SuccessBanner message={message} />

      <Card>
        {assets.loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={assets.data.items}
            rowKey={(row, index) => getId(row) || String(index)}
            empty="No assets found."
            columns={[
              {
                key: "asset",
                label: "Asset",
                render: (row) => (
                  <div>
                    <Link className="table-link" href={`/admin/assets/${getId(row)}`}>
                      {textValue(row.name ?? row.fileName)}
                    </Link>
                    <span className="muted-id">{textValue(row.mimeType)}</span>
                  </div>
                ),
              },
              {
                key: "order",
                label: "Order",
                render: (row) => (
                  <Link className="table-link" href={`/admin/orders/${textValue(row.orderId)}`}>
                    {nestedText(row, ["order", "title"], textValue(row.orderId))}
                  </Link>
                ),
              },
              {
                key: "organization",
                label: "Organization",
                render: (row) => nestedText(row, ["order", "organization", "name"], textValue(row.organizationId)),
              },
              { key: "status", label: "Status", render: (row) => <StatusBadge value={textValue(row.status)} /> },
              { key: "created", label: "Created", render: (row) => dateValue(row.createdAt) },
              {
                key: "actions",
                label: "",
                render: (row) => (
                  <div className="row-actions">
                    <Link className="table-link" href={`/admin/assets/${getId(row)}`}>
                      View
                    </Link>
                    {canManage ? (
                      <Button size="sm" variant="danger" onClick={() => void archiveAsset(getId(row))}>
                        Archive
                      </Button>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
