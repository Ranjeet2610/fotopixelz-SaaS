'use client'

import { useCallback, useEffect, useRef } from 'react'
import { isPreviewableImage } from './image-preview'
import type { PreviewFetchStatus } from './types'
import { useLazyPreviewLoader } from './use-lazy-preview-loader'

type LazyUploadPreviewProps = {
  uploadId: string
  fileName: string
  mimeType: string
  status: string
  className?: string
  fetchPreviewUrl: (uploadId: string) => Promise<{ previewUrl: string }>
  onPreviewReady?: (url: string) => void
  onClickPreview?: (url: string) => void
  onFetchStatusChange?: (status: PreviewFetchStatus) => void
}

export function LazyUploadPreview({
  uploadId,
  fileName,
  mimeType,
  status,
  className,
  fetchPreviewUrl,
  onPreviewReady,
  onClickPreview,
  onFetchStatusChange
}: LazyUploadPreviewProps) {
  const previewable = isPreviewableImage(mimeType, fileName)
  const canLoad = previewable && status === 'UPLOADED'

  const onFetchStatusChangeRef = useRef(onFetchStatusChange)
  const onPreviewReadyRef = useRef(onPreviewReady)
  const lastReportedStatusRef = useRef<PreviewFetchStatus | null>(null)

  onFetchStatusChangeRef.current = onFetchStatusChange
  onPreviewReadyRef.current = onPreviewReady

  const reportStatus = useCallback((nextStatus: PreviewFetchStatus) => {
    if (lastReportedStatusRef.current === nextStatus) {
      return
    }
    lastReportedStatusRef.current = nextStatus
    onFetchStatusChangeRef.current?.(nextStatus)
  }, [])

  const load = useCallback(async () => {
    reportStatus('loading')
    const result = await fetchPreviewUrl(uploadId)
    onPreviewReadyRef.current?.(result.previewUrl)
    reportStatus('ready')
    return result.previewUrl
  }, [fetchPreviewUrl, reportStatus, uploadId])

  const { rootRef, previewUrl, loading, error } = useLazyPreviewLoader({
    enabled: canLoad,
    load
  })

  useEffect(() => {
    lastReportedStatusRef.current = null
  }, [uploadId, canLoad, previewable])

  useEffect(() => {
    if (!previewable || !canLoad) {
      reportStatus('skipped')
    }
  }, [canLoad, previewable, reportStatus])

  useEffect(() => {
    if (error) {
      reportStatus('error')
    }
  }, [error, reportStatus])

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
