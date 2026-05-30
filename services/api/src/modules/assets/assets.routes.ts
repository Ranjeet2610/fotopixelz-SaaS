import { Router } from 'express'
import { requireAdmin } from '../../common/middleware/admin'
import { requireAuth } from '../../common/middleware/auth'
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
assetsRouter.patch('/:assetId', requireAdmin, updateAssetHandler)
assetsRouter.delete('/:assetId', requireAdmin, deleteAssetHandler)

assetsRouter.get('/:assetId/versions', listAssetVersionsHandler)
assetsRouter.post('/:assetId/versions', requireAdmin, createAssetVersionHandler)
assetsRouter.patch('/:assetId/versions/:versionId', requireAdmin, updateAssetVersionHandler)
assetsRouter.delete('/:assetId/versions/:versionId', requireAdmin, deleteAssetVersionHandler)

export default assetsRouter
