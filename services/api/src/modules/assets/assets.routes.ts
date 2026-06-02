import { Router } from 'express'
import { requireAuth } from '@repo/auth'
import {
  createAssetHandler,
  createAssetVersionHandler,
  deleteAssetHandler,
  deleteAssetVersionHandler,
  getAssetHandler,
  getAssetsHealth,
  listAssetsHandler,
  listAssetVersionsHandler,
  updateAssetHandler,
  updateAssetVersionHandler
} from './assets.controller'

const assetsRouter = Router()

assetsRouter.get('/health', getAssetsHealth)

assetsRouter.use(requireAuth)
assetsRouter.get('/', listAssetsHandler)
assetsRouter.post('/', createAssetHandler)
assetsRouter.get('/:assetId', getAssetHandler)
assetsRouter.patch('/:assetId', updateAssetHandler)
assetsRouter.delete('/:assetId', deleteAssetHandler)

assetsRouter.get('/:assetId/versions', listAssetVersionsHandler)
assetsRouter.post('/:assetId/versions', createAssetVersionHandler)
assetsRouter.patch('/:assetId/versions/:versionId', updateAssetVersionHandler)
assetsRouter.delete('/:assetId/versions/:versionId', deleteAssetVersionHandler)

export default assetsRouter
