'use client'

import { useMemo, useState } from 'react'
import { ImageLightbox } from './image-lightbox'
import { LazyDeliverablePreview } from './lazy-deliverable-preview'
import type { DeliverableRecord } from './types'

function defaultFormatBytes(bytes: number) {
  if (!bytes || bytes <= 0) {
    return '—'
  }
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export type DeliverableGalleryProps = {
  deliverables: DeliverableRecord[]
  loading?: boolean
  emptyMessage?: string
  allowDelete?: boolean
  fetchPreviewUrl: (assetId: string) => Promise<{ previewUrl: string }>
  downloadDeliverable: (deliverable: DeliverableRecord) => void | Promise<void>
  onDelete?: (assetId: string) => void
  formatBytes?: (bytes: number) => string
  showImageCount?: boolean
  onDownloadAll?: () => void | Promise<void>
  downloadAllBusy?: boolean
  downloadAllNote?: string
}

export function DeliverableGallery({
  deliverables,
  loading = false,
  emptyMessage = 'No deliverables uploaded yet.',
  allowDelete = false,
  fetchPreviewUrl,
  downloadDeliverable,
  onDelete,
  formatBytes = defaultFormatBytes,
  showImageCount = false,
  onDownloadAll,
  downloadAllBusy = false,
  downloadAllNote
}: DeliverableGalleryProps) {
  const [lightbox, setLightbox] = useState<{
    url: string
    fileName: string
    deliverable: DeliverableRecord
  } | null>(null)

  const readyCount = useMemo(
    () => deliverables.filter((item) => item.status === 'READY' || item.status === 'DELIVERED').length,
    [deliverables]
  )

  if (loading) {
    return <p className="upload-gallery-loading">Loading deliverables…</p>
  }

  if (deliverables.length === 0) {
    return <div className="upload-gallery-empty">{emptyMessage}</div>
  }

  return (
    <>
      {showImageCount || onDownloadAll ? (
        <div className="upload-gallery-toolbar">
          {showImageCount ? (
            <p className="upload-gallery-count">
              {readyCount} deliverable{readyCount === 1 ? '' : 's'}
            </p>
          ) : (
            <span />
          )}
          {onDownloadAll ? (
            <div className="upload-gallery-toolbar-actions">
              <button
                type="button"
                className="upload-gallery-btn"
                disabled={downloadAllBusy || readyCount === 0}
                onClick={() => void onDownloadAll()}
              >
                {downloadAllBusy ? 'Downloading…' : 'Download All Deliverables'}
              </button>
              {downloadAllNote ? <p className="upload-gallery-note">{downloadAllNote}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="upload-grid">
        {deliverables.map((deliverable) => (
          <div className="upload-tile" key={deliverable.id}>
            <div className="upload-thumb">
              <LazyDeliverablePreview
                assetId={deliverable.id}
                fileName={deliverable.fileName}
                mimeType={deliverable.mimeType}
                status={deliverable.status}
                className="upload-thumb-image"
                fetchPreviewUrl={fetchPreviewUrl}
                onClickPreview={(url) =>
                  setLightbox({
                    url,
                    fileName: deliverable.name || deliverable.fileName,
                    deliverable
                  })
                }
              />
            </div>
            <div className="upload-meta">
              <p className="upload-name" title={deliverable.name || deliverable.fileName}>
                {deliverable.name || deliverable.fileName}
              </p>
              <p className="upload-size">{formatBytes(deliverable.fileSize ?? 0)}</p>
              <div className="upload-actions">
                {deliverable.status === 'READY' || deliverable.status === 'DELIVERED' ? (
                  <button
                    type="button"
                    className="upload-gallery-btn"
                    onClick={() => void downloadDeliverable(deliverable)}
                  >
                    Download
                  </button>
                ) : null}
                {allowDelete && onDelete ? (
                  <button
                    type="button"
                    className="upload-gallery-btn"
                    onClick={() => onDelete(deliverable.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ImageLightbox
        open={Boolean(lightbox)}
        imageUrl={lightbox?.url ?? ''}
        fileName={lightbox?.fileName ?? ''}
        onClose={() => setLightbox(null)}
        onDownload={
          lightbox
            ? () => {
                void downloadDeliverable(lightbox.deliverable)
              }
            : undefined
        }
      />
    </>
  )
}
