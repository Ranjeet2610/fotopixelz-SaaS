'use client'

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ImageLightbox } from './image-lightbox'
import { LazyUploadPreview } from './lazy-upload-preview'
import type { PreviewFetchStatus, SourceUploadRecord } from './types'

function defaultFormatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export type SourceUploadGalleryProps = {
  uploads: SourceUploadRecord[]
  loading?: boolean
  showDebug?: boolean
  allowRemove?: boolean
  emptyMessage?: string
  additionalTiles?: ReactNode
  fetchPreviewUrl: (uploadId: string) => Promise<{ previewUrl: string }>
  downloadUpload: (upload: SourceUploadRecord) => void | Promise<void>
  onRemove?: (uploadId: string) => void
  formatBytes?: (bytes: number) => string
  showImageCount?: boolean
  onDownloadAll?: () => void | Promise<void>
  downloadAllBusy?: boolean
  downloadAllNote?: string
}

export function SourceUploadGallery({
  uploads,
  loading = false,
  showDebug = false,
  allowRemove = false,
  emptyMessage = 'No images uploaded yet.',
  additionalTiles,
  fetchPreviewUrl,
  downloadUpload,
  onRemove,
  formatBytes = defaultFormatBytes,
  showImageCount = false,
  onDownloadAll,
  downloadAllBusy = false,
  downloadAllNote
}: SourceUploadGalleryProps) {
  const [lightbox, setLightbox] = useState<{ url: string; fileName: string; upload: SourceUploadRecord } | null>(
    null
  )
  const [previewStatuses, setPreviewStatuses] = useState<Record<string, PreviewFetchStatus>>({})

  const setPreviewStatus = useCallback((uploadId: string, status: PreviewFetchStatus) => {
    setPreviewStatuses((current) => {
      if (current[uploadId] === status) {
        return current
      }
      return { ...current, [uploadId]: status }
    })
  }, [])

  const uploadedCount = useMemo(
    () => uploads.filter((upload) => upload.status === 'UPLOADED').length,
    [uploads]
  )

  if (loading) {
    return <p className="upload-gallery-loading">Loading uploaded images…</p>
  }

  const hasItems = uploads.length > 0 || Boolean(additionalTiles)

  if (!hasItems) {
    return <div className="upload-gallery-empty">{emptyMessage}</div>
  }

  return (
    <>
      {showImageCount || onDownloadAll ? (
        <div className="upload-gallery-toolbar">
          {showImageCount ? (
            <p className="upload-gallery-count">
              {uploadedCount} image{uploadedCount === 1 ? '' : 's'}
            </p>
          ) : (
            <span />
          )}
          {onDownloadAll ? (
            <div className="upload-gallery-toolbar-actions">
              <button
                type="button"
                className="upload-gallery-btn"
                disabled={downloadAllBusy || uploadedCount === 0}
                onClick={() => void onDownloadAll()}
              >
                {downloadAllBusy ? 'Downloading…' : 'Download All Source Images'}
              </button>
              {downloadAllNote ? <p className="upload-gallery-note">{downloadAllNote}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {showDebug ? (
        <div className="upload-gallery-debug">
          <p>
            <strong>Uploads count:</strong> {uploads.length} ({uploadedCount} UPLOADED)
          </p>
          <ul>
            {uploads.map((upload) => (
              <li key={upload.id}>
                <code>{upload.id}</code> · {upload.status} · preview:{' '}
                {previewStatuses[upload.id] ?? 'idle'}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="upload-grid">
        {uploads.map((upload) => (
          <SourceUploadTile
            key={upload.id}
            upload={upload}
            allowRemove={allowRemove}
            fetchPreviewUrl={fetchPreviewUrl}
            formatBytes={formatBytes}
            setPreviewStatus={setPreviewStatus}
            onOpenPreview={(url) =>
              setLightbox({ url, fileName: upload.originalName || upload.fileName, upload })
            }
            onRemove={onRemove ? () => onRemove(upload.id) : undefined}
            onDownload={() => void downloadUpload(upload)}
          />
        ))}
        {additionalTiles}
      </div>

      <ImageLightbox
        open={Boolean(lightbox)}
        imageUrl={lightbox?.url ?? ''}
        fileName={lightbox?.fileName ?? ''}
        onClose={() => setLightbox(null)}
        onDownload={
          lightbox
            ? () => {
                void downloadUpload(lightbox.upload)
              }
            : undefined
        }
      />
    </>
  )
}

type SourceUploadTileProps = {
  upload: SourceUploadRecord
  allowRemove: boolean
  fetchPreviewUrl: (uploadId: string) => Promise<{ previewUrl: string }>
  formatBytes: (bytes: number) => string
  setPreviewStatus: (uploadId: string, status: PreviewFetchStatus) => void
  onOpenPreview: (url: string) => void
  onRemove?: () => void
  onDownload: () => void
}

function SourceUploadTile({
  upload,
  allowRemove,
  fetchPreviewUrl,
  formatBytes,
  setPreviewStatus,
  onOpenPreview,
  onRemove,
  onDownload
}: SourceUploadTileProps) {
  const name = upload.originalName || upload.fileName

  const onFetchStatusChange = useCallback(
    (status: PreviewFetchStatus) => setPreviewStatus(upload.id, status),
    [setPreviewStatus, upload.id]
  )

  return (
    <div className="upload-tile">
      <div className="upload-thumb">
        <LazyUploadPreview
          uploadId={upload.id}
          fileName={upload.fileName}
          mimeType={upload.mimeType}
          status={upload.status}
          className="upload-thumb-image"
          fetchPreviewUrl={fetchPreviewUrl}
          onClickPreview={onOpenPreview}
          onFetchStatusChange={onFetchStatusChange}
        />
      </div>
      <div className="upload-meta">
        <p className="upload-name" title={name}>
          {name}
        </p>
        <p className="upload-size">{formatBytes(upload.fileSize)}</p>
        <div className="upload-actions">
          {upload.status === 'UPLOADED' ? (
            <button type="button" className="upload-gallery-btn" onClick={onDownload}>
              Download
            </button>
          ) : null}
          {allowRemove && onRemove ? (
            <button type="button" className="upload-gallery-btn" onClick={onRemove}>
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
