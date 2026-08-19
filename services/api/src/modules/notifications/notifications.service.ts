import type { NotificationType } from '@prisma/client'
import { prisma } from '../../database/prisma'

export function getNotificationsStatus() {
  return { module: 'notifications', status: 'ok' as const }
}

export async function createNotification(input: {
  userId: string
  type: NotificationType
  title: string
  message: string
}) {
  return prisma.notification.create({
    data: input,
    select: {
      id: true,
      userId: true,
      type: true,
      title: true,
      message: true,
      readAt: true,
      createdAt: true
    }
  })
}

export async function createNotificationsForUsers(
  userIds: string[],
  input: {
    type: NotificationType
    title: string
    message: string
  }
) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))]
  if (uniqueIds.length === 0) {
    return []
  }

  await prisma.notification.createMany({
    data: uniqueIds.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      message: input.message
    }))
  })

  return uniqueIds
}

export async function listUserNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      readAt: true,
      createdAt: true
    }
  })
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true }
  })

  if (!notification) {
    return null
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
    select: {
      id: true,
      readAt: true
    }
  })
}
