import Fastify, { type FastifyInstance } from 'fastify'
import fastifyStatic from '@fastify/static'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import { registerRoutes } from './routes.js'
import { createWebSocketServer } from './websocket.js'
import { createWatcher } from '../core/watcher.js'
import { readBoard } from '../core/fs-layer.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function createServer(boardPath: string): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: false
  })

  // Store board path for routes
  fastify.decorate('boardPath', boardPath)

  // Create WebSocket server
  const { wss, broadcast } = createWebSocketServer(fastify.server)

  // Register REST API routes
  registerRoutes(fastify, boardPath, broadcast)

  // Serve static files from web/dist
  // When built, __dirname is dist/, so web/dist is at ../web/dist
  const webDistPath = join(__dirname, '../web/dist')

  if (existsSync(webDistPath)) {
    await fastify.register(fastifyStatic, {
      root: webDistPath,
      prefix: '/'
    })
  } else {
    // Fallback: serve inline HTML if web/dist doesn't exist
    fastify.get('/', async (request, reply) => {
      reply.type('text/html')
      return getFallbackHtml()
    })
  }

  // Create file watcher for hot reload
  const watcher = createWatcher(boardPath, async () => {
    try {
      const board = await readBoard(boardPath)
      broadcast({ type: 'sync', data: { columns: board.columns } })
    } catch {
      // Board might be in an invalid state during edits
    }
  })

  // Cleanup on close
  fastify.addHook('onClose', async () => {
    watcher.close()
    wss.close()
  })

  return fastify
}

function getFallbackHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>board</title>
  <style>
    body {
      font-family: 'SF Mono', monospace;
      background: #0a0a0a;
      color: #e5e5e5;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .msg {
      text-align: center;
      padding: 40px;
    }
    h1 { font-size: 16px; margin-bottom: 16px; }
    p { color: #666; font-size: 13px; }
    code { background: #222; padding: 2px 6px; }
  </style>
</head>
<body>
  <div class="msg">
    <h1>Web UI not built</h1>
    <p>Run <code>npm run build:web</code> to build the web interface</p>
  </div>
</body>
</html>`
}
