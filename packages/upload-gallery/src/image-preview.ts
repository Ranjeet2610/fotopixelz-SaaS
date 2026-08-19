const PREVIEWABLE_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff'])

const PREVIEWABLE_IMAGE_MIME_SUBTYPES = new Set(['jpeg', 'jpg', 'png', 'webp', 'tif', 'tiff'])

export function isPreviewableImage(mimeType: string, fileName: string) {
  const normalizedMime = mimeType.trim().toLowerCase()

  if (normalizedMime.startsWith('image/')) {
    const subtype = normalizedMime.slice('image/'.length)
    return PREVIEWABLE_IMAGE_MIME_SUBTYPES.has(subtype)
  }

  const extension = fileName.trim().toLowerCase().split('.').pop()
  return extension ? PREVIEWABLE_IMAGE_EXTENSIONS.has(extension) : false
}
