import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import type { WsMessage } from '../core/types.js'

export interface WebSocketManager {
  wss: WebSocketServer
  broadcast: (message: WsMessage) => void
}

export function createWebSocketServer(server: Server): WebSocketManager {
  const wss = new WebSocketServer({
    server,
    path: '/ws'
  })

  const clients = new Set<WebSocket>()

  wss.on('connection', (ws) => {
    clients.add(ws)

    ws.on('close', () => {
      clients.delete(ws)
    })

    ws.on('error', () => {
      clients.delete(ws)
    })
  })

  const broadcast = (message: WsMessage): void => {
    const data = JSON.stringify(message)
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    }
  }

  return { wss, broadcast }
}
