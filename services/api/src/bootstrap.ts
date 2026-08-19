import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'

loadEnv({
  path: resolve(process.cwd(), '../../.env')
})

// Start the actual server only after env is loaded
await import('./server')