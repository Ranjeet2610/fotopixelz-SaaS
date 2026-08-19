import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'

// The monorepo's single source of truth for env vars is the root `.env`.
// Matches the loading pattern in packages/database/src/client.ts and
// services/api/src/server.ts.
loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true })
loadEnv({ path: resolve(process.cwd(), '../../.env'), quiet: true })

import { queueRegistry } from './queues/registry'

export function bootstrapWorkers() {
  return { status: 'running' as const, queues: queueRegistry }
}

console.log('Workers running...', bootstrapWorkers())
