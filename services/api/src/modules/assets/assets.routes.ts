import { Router } from 'express'
import { requireAuth } from '@repo/auth'
import {
  completeDeliverableUploadHandler,
  createAssetHandler,
  createAssetVersionHandler,
  createDeliverablePresignedUrlHandler,
  deleteAssetHandler,
  deleteAssetVersionHandler,
  getAssetDownloadUrlHandler,
  getAssetHandler,
  getAssetsHealth,
  listAssetsHandler,
  listAssetVersionsHandler,
  updateAssetHandler,
  updateAssetVersionHandler
} from './assets.controller'

const assetsRouter = Router()

assetsRouter.use(requireAuth)

assetsRouter.get('/health', getAssetsHealth)
assetsRouter.post('/presigned-url', createDeliverablePresignedUrlHandler)
assetsRouter.post('/complete', completeDeliverableUploadHandler)
assetsRouter.post('/', createAssetHandler)
assetsRouter.get('/', listAssetsHandler)
assetsRouter.get('/:assetId/download-url', getAssetDownloadUrlHandler)
assetsRouter.get('/:assetId/versions', listAssetVersionsHandler)
assetsRouter.post('/:assetId/versions', createAssetVersionHandler)
assetsRouter.patch('/:assetId/versions/:versionId', updateAssetVersionHandler)
assetsRouter.delete('/:assetId/versions/:versionId', deleteAssetVersionHandler)
assetsRouter.get('/:assetId', getAssetHandler)
assetsRouter.patch('/:assetId', updateAssetHandler)
assetsRouter.delete('/:assetId', deleteAssetHandler)

export default assetsRouter
