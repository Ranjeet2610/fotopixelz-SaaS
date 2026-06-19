import type { CommentStatus, CommentType } from '@prisma/client'
import type { Role } from '@repo/auth'

export type RequestContext = {
  userId: string
  role: Role
}

export type ListOrderCommentsQuery = {
  page: number
  limit: number
  search?: string
  userId?: string
  commentType?: CommentType
  status?: CommentStatus
  assetId?: string
}

export type CreateOrderCommentInput = {
  orderId: string
  body: string
  commentType?: CommentType
  status?: CommentStatus
  assetId?: string
  parentId?: string
  attachmentStorageKey?: string
  attachmentFileName?: string
  attachmentMimeType?: string
  attachmentUrl?: string
}

export type UpdateOrderCommentInput = {
  body?: string
  status?: CommentStatus
}

export type CommentAttachmentPresignedInput = {
  orderId: string
  fileName: string
  mimeType: string
  fileSize: number
}
