export type SourceUploadRecord = {
  id: string
  originalName: string
  fileName: string
  mimeType: string
  fileSize: number
  status: string
}

export type PreviewUrlResult = {
  previewUrl: string
}

export type PreviewFetchStatus = 'idle' | 'loading' | 'ready' | 'error' | 'skipped'

export type DeliverableRecord = {
  id: string
  name: string
  fileName: string
  mimeType: string
  status: string
  fileSize?: number
  version?: number
  reviewRound?: number
  isCurrent?: boolean
  uploadedBy?: string
  createdAt?: string
}
