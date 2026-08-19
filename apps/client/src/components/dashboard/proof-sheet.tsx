"use client";

import { useState } from "react";
import { downloadAsset } from "@/lib/asset-client";
import type { AssetRecord } from "@/lib/asset-types";
import { Thumbnail } from "./thumbnail";

// Ready-to-download deliverables (docs/CLIENT-DASHBOARD.md §2.6) — proof-sheet
// density since the job here is "grab what I need," not "study each order."
export function ProofSheet({ assets, moreCount }: { assets: AssetRecord[]; moreCount: number }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-8">
      {assets.map((asset) => (
        <ProofSheetTile key={asset.id} asset={asset} />
      ))}
      {moreCount > 0 ? (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border font-mono text-xs text-muted-foreground">
          +{moreCount}
        </div>
      ) : null}
    </div>
  );
}

function ProofSheetTile({ asset }: { asset: AssetRecord }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadAsset(asset);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="group relative h-24 overflow-hidden rounded-lg">
      <Thumbnail asset={asset} className="h-full w-full" />
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={downloading}
        aria-label={`Download ${asset.name || asset.fileName}`}
        className="absolute right-1.5 bottom-1.5 flex size-6 items-center justify-center rounded-full bg-background/70 text-foreground opacity-80 transition-opacity hover:bg-background/95 hover:opacity-100 disabled:opacity-40"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />
        </svg>
      </button>
    </div>
  );
}
