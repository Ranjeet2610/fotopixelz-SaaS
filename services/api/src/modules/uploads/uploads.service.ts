import {
  createAsset,
  deleteAsset,
  getAsset,
  listAssets,
  updateAsset
} from '../assets/assets.service'
import type { RequestContext as AssetRequestContext } from '../assets/assets.types'
import type {
  CreateUploadInput,
  ListUploadsQuery,
  RequestContext,
  UpdateUploadInput
} from './uploads.types'

export function getUploadsStatus() {
  return { module: 'uploads', status: 'ok' as const }
}

export async function listUploads(context: RequestContext, query: ListUploadsQuery) {
  return listAssets(toAssetContext(context), query)
}

export async function getUpload(context: RequestContext, uploadId: string) {
  return getAsset(toAssetContext(context), uploadId)
}

export async function createUpload(context: RequestContext, input: CreateUploadInput) {
  return createAsset(toAssetContext(context), {
    ...input,
    status: 'UPLOADED'
  })
}

export async function updateUpload(context: RequestContext, uploadId: string, input: UpdateUploadInput) {
  return updateAsset(toAssetContext(context), uploadId, input)
}

export async function deleteUpload(context: RequestContext, uploadId: string) {
  await deleteAsset(toAssetContext(context), uploadId)
}

function toAssetContext(context: RequestContext): AssetRequestContext {
  return context
}
