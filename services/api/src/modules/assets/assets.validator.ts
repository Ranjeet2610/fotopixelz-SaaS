import { z } from "zod";

const assetStatusSchema = z.enum([
  "UPLOADED",
  "PROCESSING",
  "READY_FOR_EDITING",
  "EDITED",
  "QA_PENDING",
  "READY_FOR_DELIVERY",
  "DELIVERED",
  "ARCHIVED",
]);

export const assetIdParamsSchema = z.object({
  assetId: z.string().min(1),
});

export const assetVersionParamsSchema = assetIdParamsSchema.extend({
  versionId: z.string().min(1),
});

export const listAssetsQuerySchema = z.object({
  orderId: z.string().min(1).optional(),
  status: assetStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const createAssetSchema = z.object({
  orderId: z.string().min(1),
  fileName: z.string().trim().min(1),
  originalUrl: z.string().trim().url(),
  status: assetStatusSchema.default("UPLOADED"),
  versionNotes: z.string().trim().min(1).optional(),
});

export const updateAssetSchema = z
  .object({
    fileName: z.string().trim().min(1).optional(),
    originalUrl: z.string().trim().url().optional(),
    status: assetStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const createAssetVersionSchema = z.object({
  version: z.coerce.number().int().positive().optional(),
  fileUrl: z.string().trim().url(),
  notes: z.string().trim().min(1).optional(),
});

export const updateAssetVersionSchema = z
  .object({
    version: z.coerce.number().int().positive().optional(),
    fileUrl: z.string().trim().url().optional(),
    notes: z.string().trim().min(1).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });
