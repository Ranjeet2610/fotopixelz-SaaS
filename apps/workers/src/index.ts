import 'dotenv/config'
import { queueRegistry } from './queues/registry'

export function bootstrapWorkers() {
  return { status: 'running' as const, queues: queueRegistry }
}

console.log('Workers running...', bootstrapWorkers())
