import { Router } from 'express'
import { getAssetsHealth } from './assets.controller'

const assetsRouter = Router()
assetsRouter.get('/health', getAssetsHealth)

export default assetsRouter

