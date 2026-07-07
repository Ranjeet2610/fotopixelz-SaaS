import IORedis, { type Redis } from 'ioredis'
import { env } from '../../config/env'

let client: Redis | null = null

export function getRedisClient(): Redis {
  if (!client) {
    if (!env.redisUrl) {
      throw new Error('REDIS_URL is missing')
    }

    client = new IORedis(env.redisUrl, { maxRetriesPerRequest: 2 })
  }

  return client
}

