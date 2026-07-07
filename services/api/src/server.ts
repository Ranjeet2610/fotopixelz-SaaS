import http from 'node:http'

import app from './app'
import { env } from './config/env'
import { warnIfEmailNotConfigured } from './config/email'
import { initSocketServer } from './sockets/socket'

const PORT = env.port

const server = http.createServer(app)

warnIfEmailNotConfigured()
initSocketServer(server)

server.listen(PORT, () => {
  console.log(`API running on port ${PORT}`)
})