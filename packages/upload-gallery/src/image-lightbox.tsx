'use client'

import { useEffect } from 'react'

type ImageLightboxProps = {
  open: boolean
  imageUrl: string
  fileName: string
  onClose: () => void
  onDownload?: () => void
}

export function ImageLightbox({ open, imageUrl, fileName, onClose, onDownload }: ImageLightboxProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={`Preview ${fileName}`}>
      <button type="button" className="image-lightbox-backdrop" aria-label="Close preview" onClick={onClose} />
      <div className="image-lightbox-panel">
        <div className="image-lightbox-toolbar">
          <p className="image-lightbox-title" title={fileName}>
            {fileName}
          </p>
          <div className="image-lightbox-actions">
            {onDownload ? (
              <button type="button" className="upload-gallery-btn" onClick={onDownload}>
                Download
              </button>
            ) : null}
            <button type="button" className="upload-gallery-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <img className="image-lightbox-image" src={imageUrl} alt={fileName} />
      </div>
    </div>
  )
}
