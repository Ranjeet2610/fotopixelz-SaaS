import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { verifyAccessToken } from '@repo/auth'

let io: Server | undefined

export function initSocketServer(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    },
    path: '/socket.io'
  })

  io.use((socket, next) => {
    try {
      const token =
        typeof socket.handshake.auth.token === 'string'
          ? socket.handshake.auth.token
          : typeof socket.handshake.headers.authorization === 'string'
            ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
            : ''

      if (!token) {
        return next(new Error('Unauthorized'))
      }

      const user = verifyAccessToken(token)
      socket.data.userId = user.sub
      socket.data.role = user.role
      return next()
    } catch {
      return next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    socket.on('order.join', (orderId: string) => {
      if (typeof orderId === 'string' && orderId.length > 0) {
        socket.join(orderRoom(orderId))
      }
    })

    socket.on('order.leave', (orderId: string) => {
      if (typeof orderId === 'string' && orderId.length > 0) {
        socket.leave(orderRoom(orderId))
      }
    })
  })

  return io
}

export function getSocketServer() {
  return io
}

function orderRoom(orderId: string) {
  return `order:${orderId}`
}

export function emitOrderRoomEvent(orderId: string, event: string, payload: unknown) {
  if (!io) {
    return
  }

  io.to(orderRoom(orderId)).emit(event, payload)
}

export function createSocketServer() {
  return { status: io ? 'running' as const : 'placeholder' as const }
}
