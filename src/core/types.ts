/**
 * Priority levels for tasks
 */
export type Priority = 'low' | 'medium' | 'high'

/**
 * Task ID format: {column-slug}/{task-slug}
 * Example: "backlog/implement-auth"
 */
export type TaskId = string

/**
 * Frontmatter fields for a task
 */
export interface TaskFrontmatter {
  title: string
  priority?: Priority
  created?: string
  tags?: string[]
}

/**
 * A task (represented as a markdown file)
 */
export interface Task {
  /** Unique ID: {column-slug}/{task-slug} */
  id: TaskId
  /** Filename without extension */
  slug: string
  /** Display title from frontmatter */
  title: string
  /** Priority level */
  priority?: Priority
  /** ISO date string of creation */
  created?: string
  /** Tags for filtering */
  tags: string[]
  /** Markdown content (without frontmatter) */
  content: string
}

/**
 * A column (represented as a folder)
 */
export interface Column {
  /** Slug extracted from folder name (without order prefix) */
  id: string
  /** Display name (derived from slug) */
  name: string
  /** Sort order (from folder prefix like 01-, 02-) */
  order: number
  /** Tasks in this column */
  tasks: Task[]
}

/**
 * The full board state
 */
export interface Board {
  /** Path to .board/ directory */
  path: string
  /** Columns in order */
  columns: Column[]
}

/**
 * Options for creating a new task
 */
export interface CreateTaskOptions {
  title: string
  priority?: Priority
  tags?: string[]
  content?: string
}

/**
 * Options for updating a task
 */
export interface UpdateTaskOptions {
  title?: string
  priority?: Priority
  tags?: string[]
  content?: string
  /** Move to different column */
  column?: string
}

/**
 * Lock file data for multi-session support
 */
export interface LockFileData {
  port: number
  path: string
  pid: number
  started: string
}

/**
 * WebSocket message types
 */
export type WsMessageType =
  | 'sync'
  | 'task:created'
  | 'task:updated'
  | 'task:deleted'
  | 'column:created'
  | 'column:updated'
  | 'column:deleted'

/**
 * WebSocket message structure
 */
export interface WsMessage {
  type: WsMessageType
  data: unknown
}

/**
 * Default columns created on init
 */
export const DEFAULT_COLUMNS = [
  { order: 1, slug: 'backlog', name: 'Backlog' },
  { order: 2, slug: 'todo', name: 'Todo' },
  { order: 3, slug: 'in-progress', name: 'In Progress' },
  { order: 4, slug: 'done', name: 'Done' }
] as const

/**
 * Default port for the server
 */
export const DEFAULT_PORT = 8042

/**
 * Max port attempts when default is in use
 */
export const MAX_PORT_ATTEMPTS = 100

/**
 * Board directory name
 */
export const BOARD_DIR = '.board'

/**
 * Lock files directory
 */
export const LOCK_DIR = '.board-servers'
