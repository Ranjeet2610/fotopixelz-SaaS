import http from 'node:http'
import 'dotenv/config'
import app from './app'
import { env } from './config/env'
import { initSocketServer } from './sockets/socket'

const PORT = env.port
const server = http.createServer(app)

initSocketServer(server)

server.listen(PORT, () => {
  console.log(`API running on port ${PORT}`)
})
