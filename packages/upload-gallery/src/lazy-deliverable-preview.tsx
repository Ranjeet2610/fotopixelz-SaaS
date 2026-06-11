'use client'

import { useCallback } from 'react'
import { isPreviewableImage } from './image-preview'
import { useLazyPreviewLoader } from './use-lazy-preview-loader'

type LazyDeliverablePreviewProps = {
  assetId: string
  fileName: string
  mimeType: string
  status: string
  className?: string
  fetchPreviewUrl: (assetId: string) => Promise<{ previewUrl: string }>
  onClickPreview?: (url: string) => void
}

export function LazyDeliverablePreview({
  assetId,
  fileName,
  mimeType,
  status,
  className,
  fetchPreviewUrl,
  onClickPreview
}: LazyDeliverablePreviewProps) {
  const previewable = isPreviewableImage(mimeType, fileName)
  const canLoad = previewable && (status === 'READY' || status === 'DELIVERED')

  const load = useCallback(async () => {
    const result = await fetchPreviewUrl(assetId)
    return result.previewUrl
  }, [assetId, fetchPreviewUrl])

  const { rootRef, previewUrl, loading, error } = useLazyPreviewLoader({
    enabled: canLoad,
    load
  })

  return (
    <div ref={rootRef} className="upload-thumb-shell">
      {!previewable ? (
        <span className="upload-thumb-fallback" aria-hidden>
          FILE
        </span>
      ) : !canLoad ? (
        <span className="upload-thumb-fallback" aria-hidden>
          IMG
        </span>
      ) : loading ? (
        <span className="upload-thumb-fallback" aria-busy="true">
          …
        </span>
      ) : error || !previewUrl ? (
        <span className="upload-thumb-fallback" aria-hidden>
          IMG
        </span>
      ) : (
        <button
          type="button"
          className="upload-thumb-button"
          onClick={() => onClickPreview?.(previewUrl)}
          aria-label={`Open preview for ${fileName}`}
        >
          <img className={className ?? 'upload-thumb-image'} src={previewUrl} alt="" loading="lazy" />
        </button>
      )}
    </div>
  )
}
