import type { FastifyInstance } from 'fastify'
import type { WsMessage } from '../core/types.js'
import { readdir, stat } from 'fs/promises'
import { join, dirname, relative } from 'path'
import {
  readBoard,
  readTask,
  writeTask,
  deleteTask,
  moveTask,
  createColumn,
  deleteColumn,
  renameColumn
} from '../core/fs-layer.js'

// Recursively list files and directories
async function listFiles(dir: string, base: string, maxDepth = 3, depth = 0): Promise<string[]> {
  if (depth >= maxDepth) return []

  const files: string[] = []
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      // Skip hidden files and common non-source directories
      if (entry.name.startsWith('.') ||
          entry.name === 'node_modules' ||
          entry.name === 'dist' ||
          entry.name === 'build' ||
          entry.name === 'coverage') continue

      const fullPath = join(dir, entry.name)
      const relativePath = relative(base, fullPath)

      if (entry.isDirectory()) {
        // Include directory with trailing slash
        files.push(relativePath + '/')
        files.push(...await listFiles(fullPath, base, maxDepth, depth + 1))
      } else {
        files.push(relativePath)
      }
    }
  } catch {
    // Ignore permission errors
  }
  return files
}

export function registerRoutes(
  fastify: FastifyInstance,
  boardPath: string,
  broadcast: (message: WsMessage) => void
): void {
  // Helper to broadcast full board sync
  const broadcastSync = async () => {
    const board = await readBoard(boardPath)
    broadcast({ type: 'sync', data: { columns: board.columns } })
  }

  // Get full board state
  fastify.get('/api/board', async () => {
    const board = await readBoard(boardPath)
    return { columns: board.columns }
  })

  // List project files for @ mentions
  fastify.get<{ Querystring: { q?: string } }>('/api/files', async (request) => {
    const projectRoot = dirname(boardPath) // Parent of .board
    const query = (request.query.q || '').toLowerCase()
    const allFiles = await listFiles(projectRoot, projectRoot)
    const filtered = query
      ? allFiles.filter(f => f.toLowerCase().startsWith(query)).slice(0, 20)
      : allFiles.slice(0, 50)
    return { files: filtered }
  })

  // Create column
  fastify.post<{ Body: { name: string } }>('/api/columns', async (request) => {
    const { name } = request.body
    const column = await createColumn(boardPath, name)
    await broadcastSync()
    return column
  })

  // Update column
  fastify.patch<{
    Params: { id: string }
    Body: { name?: string; order?: number }
  }>('/api/columns/:id', async (request) => {
    const { id } = request.params
    const { name } = request.body

    if (name) {
      const column = await renameColumn(boardPath, id, name)
      await broadcastSync()
      return column
    }

    // TODO: Handle order change
    return { success: true }
  })

  // Delete column
  fastify.delete<{ Params: { id: string } }>('/api/columns/:id', async (request) => {
    const { id } = request.params
    await deleteColumn(boardPath, id)
    await broadcastSync()
    return { success: true }
  })

  // Create task
  fastify.post<{
    Body: {
      column: string
      title: string
      priority?: 'low' | 'medium' | 'high'
      tags?: string[]
      content?: string
    }
  }>('/api/tasks', async (request) => {
    const { column, title, priority, tags, content } = request.body
    const task = await writeTask(boardPath, column, { title, priority, tags, content })
    await broadcastSync()
    return task
  })

  // Get single task
  fastify.get<{
    Params: { column: string; slug: string }
  }>('/api/tasks/:column/:slug', async (request) => {
    const { column, slug } = request.params
    return readTask(boardPath, column, slug)
  })

  // Update task
  fastify.patch<{
    Params: { column: string; slug: string }
    Body: {
      title?: string
      priority?: 'low' | 'medium' | 'high'
      tags?: string[]
      content?: string
      column?: string
    }
  }>('/api/tasks/:column/:slug', async (request) => {
    const { column: currentColumn, slug } = request.params
    const { column: newColumn, ...updates } = request.body

    // Handle move to different column
    if (newColumn && newColumn !== currentColumn) {
      const task = await moveTask(boardPath, currentColumn, slug, newColumn)
      await broadcastSync()
      return task
    }

    // Handle content update
    if (Object.keys(updates).length > 0) {
      const existing = await readTask(boardPath, currentColumn, slug)
      const task = await writeTask(boardPath, currentColumn, {
        title: updates.title ?? existing.title,
        priority: updates.priority ?? existing.priority,
        tags: updates.tags ?? existing.tags,
        content: updates.content ?? existing.content
      }, slug)
      await broadcastSync()
      return task
    }

    return readTask(boardPath, currentColumn, slug)
  })

  // Delete task
  fastify.delete<{
    Params: { column: string; slug: string }
  }>('/api/tasks/:column/:slug', async (request) => {
    const { column, slug } = request.params
    await deleteTask(boardPath, column, slug)
    await broadcastSync()
    return { success: true }
  })
}
