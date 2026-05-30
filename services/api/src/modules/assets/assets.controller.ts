import type { Request, Response } from 'express'
import type { Role } from '@repo/auth/roles'
import { AppError } from '../../common/errors/app-error'
import {
  assetIdParamsSchema,
  assetVersionParamsSchema,
  createAssetSchema,
  createAssetVersionSchema,
  listAssetsQuerySchema,
  updateAssetSchema,
  updateAssetVersionSchema
} from './assets.validator'
import {
  createAsset,
  createAssetVersion,
  deleteAsset,
  deleteAssetVersion,
  getAsset,
  getAssetsStatus,
  listAssets,
  listAssetVersions,
  updateAsset,
  updateAssetVersion
} from './assets.service'
import type { RequestContext } from './assets.types'

export function getAssetsHealth(_req: Request, res: Response) {
  res.status(200).json(getAssetsStatus())
}

export async function listAssetsHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = listAssetsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const assets = await listAssets(context, parsed.data)
    return res.status(200).json({ success: true, data: assets })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function getAssetHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = assetIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    const asset = await getAsset(context, params.data.assetId)
    return res.status(200).json({ success: true, data: asset })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function createAssetHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = createAssetSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const asset = await createAsset(context, parsed.data)
    return res.status(201).json({ success: true, data: asset })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateAssetHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = assetIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  const parsed = updateAssetSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const asset = await updateAsset(context, params.data.assetId, parsed.data)
    return res.status(200).json({ success: true, data: asset })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function deleteAssetHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = assetIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    await deleteAsset(context, params.data.assetId)
    return res.status(204).send()
  } catch (error) {
    return sendError(res, error)
  }
}

export async function listAssetVersionsHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = assetIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    const versions = await listAssetVersions(context, params.data.assetId)
    return res.status(200).json({ success: true, data: versions })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function createAssetVersionHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = assetIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  const parsed = createAssetVersionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const version = await createAssetVersion(context, params.data.assetId, parsed.data)
    return res.status(201).json({ success: true, data: version })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateAssetVersionHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = assetVersionParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  const parsed = updateAssetVersionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const version = await updateAssetVersion(
      context,
      params.data.assetId,
      params.data.versionId,
      parsed.data
    )
    return res.status(200).json({ success: true, data: version })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function deleteAssetVersionHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = assetVersionParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    await deleteAssetVersion(context, params.data.assetId, params.data.versionId)
    return res.status(204).send()
  } catch (error) {
    return sendError(res, error)
  }
}

function requestContext(req: Request): RequestContext | undefined {
  if (!req.userId || !req.role) {
    return undefined
  }

  return {
    userId: req.userId,
    role: req.role as Role
  }
}

function sendError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message })
  }

  const message = error instanceof Error ? error.message : 'Internal server error'
  return res.status(500).json({ success: false, message })
}
