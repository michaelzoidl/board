import { readdir, readFile, writeFile, mkdir, rm, rename, stat } from 'fs/promises'
import { join } from 'path'
import {
  parseTask,
  serializeTask,
  slugify,
  slugToName,
  parseColumnFolder,
  createColumnFolder
} from './markdown.js'
import {
  type Board,
  type Column,
  type Task,
  type CreateTaskOptions,
  DEFAULT_COLUMNS
} from './types.js'

/**
 * Initialize a new board with default columns
 */
export async function initBoard(boardPath: string): Promise<void> {
  // Create .board directory if it doesn't exist
  await mkdir(boardPath, { recursive: true })

  // Create default columns if they don't exist
  for (const col of DEFAULT_COLUMNS) {
    const folderName = createColumnFolder(col.order, col.slug)
    const folderPath = join(boardPath, folderName)

    try {
      await stat(folderPath)
      // Folder exists, skip
    } catch {
      // Folder doesn't exist, create it
      await mkdir(folderPath)
    }
  }
}

/**
 * Read the entire board state
 */
export async function readBoard(boardPath: string): Promise<Board> {
  // Check if board exists
  try {
    await stat(boardPath)
  } catch {
    throw new Error(`Board not found at ${boardPath}`)
  }

  const entries = await readdir(boardPath, { withFileTypes: true })
  const columns: Column[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const parsed = parseColumnFolder(entry.name)
    if (!parsed) continue

    const column = await readColumnFromFolder(boardPath, entry.name, parsed)
    columns.push(column)
  }

  // Sort by order
  columns.sort((a, b) => a.order - b.order)

  return {
    path: boardPath,
    columns
  }
}

/**
 * Read a single column by its slug
 */
export async function readColumn(boardPath: string, columnSlug: string): Promise<Column> {
  const folderName = await findColumnFolder(boardPath, columnSlug)
  if (!folderName) {
    throw new Error(`Column not found: ${columnSlug}`)
  }

  const parsed = parseColumnFolder(folderName)
  if (!parsed) {
    throw new Error(`Invalid column folder: ${folderName}`)
  }

  return readColumnFromFolder(boardPath, folderName, parsed)
}

/**
 * Read a single task
 */
export async function readTask(
  boardPath: string,
  columnSlug: string,
  taskSlug: string
): Promise<Task> {
  const folderName = await findColumnFolder(boardPath, columnSlug)
  if (!folderName) {
    throw new Error(`Column not found: ${columnSlug}`)
  }

  const filePath = join(boardPath, folderName, `${taskSlug}.md`)

  try {
    const content = await readFile(filePath, 'utf-8')
    return parseTaskFile(content, columnSlug, taskSlug)
  } catch {
    throw new Error(`Task not found: ${columnSlug}/${taskSlug}`)
  }
}

/**
 * Create or update a task
 */
export async function writeTask(
  boardPath: string,
  columnSlug: string,
  options: CreateTaskOptions,
  existingSlug?: string
): Promise<Task> {
  const folderName = await findColumnFolder(boardPath, columnSlug)
  if (!folderName) {
    throw new Error(`Column not found: ${columnSlug}`)
  }

  const slug = existingSlug || slugify(options.title)
  const filePath = join(boardPath, folderName, `${slug}.md`)

  // Get existing data if updating
  let existingCreated: string | undefined

  if (existingSlug) {
    try {
      const existing = await readTask(boardPath, columnSlug, existingSlug)
      existingCreated = existing.created
    } catch {
      // Task doesn't exist, that's fine
    }
  }

  const created = existingCreated || options.created || new Date().toISOString().split('T')[0]

  const frontmatter = {
    title: options.title,
    priority: options.priority,
    created,
    tags: options.tags
  }

  const markdown = serializeTask(frontmatter, options.content || '')
  await writeFile(filePath, markdown)

  return {
    id: `${columnSlug}/${slug}`,
    slug,
    title: options.title,
    priority: options.priority,
    created,
    tags: options.tags || [],
    content: options.content || ''
  }
}

/**
 * Delete a task
 */
export async function deleteTask(
  boardPath: string,
  columnSlug: string,
  taskSlug: string
): Promise<void> {
  const folderName = await findColumnFolder(boardPath, columnSlug)
  if (!folderName) {
    throw new Error(`Column not found: ${columnSlug}`)
  }

  const filePath = join(boardPath, folderName, `${taskSlug}.md`)

  try {
    await stat(filePath)
  } catch {
    throw new Error(`Task not found: ${columnSlug}/${taskSlug}`)
  }

  await rm(filePath)
}

/**
 * Move a task to a different column
 */
export async function moveTask(
  boardPath: string,
  fromColumn: string,
  taskSlug: string,
  toColumn: string
): Promise<Task> {
  const fromFolder = await findColumnFolder(boardPath, fromColumn)
  const toFolder = await findColumnFolder(boardPath, toColumn)

  if (!fromFolder) {
    throw new Error(`Column not found: ${fromColumn}`)
  }
  if (!toFolder) {
    throw new Error(`Column not found: ${toColumn}`)
  }

  const fromPath = join(boardPath, fromFolder, `${taskSlug}.md`)
  const toPath = join(boardPath, toFolder, `${taskSlug}.md`)

  try {
    await stat(fromPath)
  } catch {
    throw new Error(`Task not found: ${fromColumn}/${taskSlug}`)
  }

  await rename(fromPath, toPath)

  return readTask(boardPath, toColumn, taskSlug)
}

/**
 * Create a new column
 */
export async function createColumn(boardPath: string, name: string): Promise<Column> {
  const slug = slugify(name)

  // Check if column already exists
  const existing = await findColumnFolder(boardPath, slug)
  if (existing) {
    throw new Error(`Column already exists: ${slug}`)
  }

  // Find next order number
  const board = await readBoard(boardPath)
  const maxOrder = board.columns.reduce((max, col) => Math.max(max, col.order), 0)
  const order = maxOrder + 1

  const folderName = createColumnFolder(order, slug)
  await mkdir(join(boardPath, folderName))

  return {
    id: slug,
    name: slugToName(slug),
    order,
    tasks: []
  }
}

/**
 * Delete a column (must be empty)
 */
export async function deleteColumn(boardPath: string, columnSlug: string): Promise<void> {
  const folderName = await findColumnFolder(boardPath, columnSlug)
  if (!folderName) {
    throw new Error(`Column not found: ${columnSlug}`)
  }

  const folderPath = join(boardPath, folderName)

  // Check if column has tasks
  const entries = await readdir(folderPath)
  const mdFiles = entries.filter(e => e.endsWith('.md'))

  if (mdFiles.length > 0) {
    throw new Error(`Cannot delete column with tasks: ${columnSlug}`)
  }

  await rm(folderPath, { recursive: true })
}

/**
 * Rename a column
 */
export async function renameColumn(
  boardPath: string,
  columnSlug: string,
  newName: string
): Promise<Column> {
  const folderName = await findColumnFolder(boardPath, columnSlug)
  if (!folderName) {
    throw new Error(`Column not found: ${columnSlug}`)
  }

  const parsed = parseColumnFolder(folderName)
  if (!parsed) {
    throw new Error(`Invalid column folder: ${folderName}`)
  }

  const newSlug = slugify(newName)
  const newFolderName = createColumnFolder(parsed.order, newSlug)

  const oldPath = join(boardPath, folderName)
  const newPath = join(boardPath, newFolderName)

  await rename(oldPath, newPath)

  return readColumn(boardPath, newSlug)
}

// Helper functions

async function findColumnFolder(boardPath: string, columnSlug: string): Promise<string | null> {
  const entries = await readdir(boardPath)

  for (const entry of entries) {
    const parsed = parseColumnFolder(entry)
    if (parsed && parsed.slug === columnSlug) {
      return entry
    }
  }

  return null
}

async function readColumnFromFolder(
  boardPath: string,
  folderName: string,
  parsed: { order: number; slug: string }
): Promise<Column> {
  const folderPath = join(boardPath, folderName)
  const entries = await readdir(folderPath)

  const tasks: Task[] = []

  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue

    const taskSlug = entry.slice(0, -3) // Remove .md
    const filePath = join(folderPath, entry)
    const content = await readFile(filePath, 'utf-8')
    const task = parseTaskFile(content, parsed.slug, taskSlug)
    tasks.push(task)
  }

  // Sort tasks alphabetically by slug for now
  tasks.sort((a, b) => a.slug.localeCompare(b.slug))

  return {
    id: parsed.slug,
    name: slugToName(parsed.slug),
    order: parsed.order,
    tasks
  }
}

function parseTaskFile(content: string, columnSlug: string, taskSlug: string): Task {
  const { frontmatter, content: body } = parseTask(content)

  return {
    id: `${columnSlug}/${taskSlug}`,
    slug: taskSlug,
    title: frontmatter.title,
    priority: frontmatter.priority,
    created: frontmatter.created,
    tags: frontmatter.tags || [],
    content: body.trim()
  }
}
