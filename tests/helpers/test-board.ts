import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { BOARD_DIR, DEFAULT_COLUMNS } from '../../src/core/types.js'

export interface TestBoard {
  /** Root directory (temp) */
  root: string
  /** Path to .board/ directory */
  boardPath: string
  /** Clean up temp directory */
  cleanup: () => Promise<void>
}

/**
 * Creates an isolated test board in a temp directory
 */
export async function createTestBoard(): Promise<TestBoard> {
  const root = await mkdtemp(join(tmpdir(), 'board-test-'))
  const boardPath = join(root, BOARD_DIR)

  return {
    root,
    boardPath,
    async cleanup() {
      await rm(root, { recursive: true, force: true })
    }
  }
}

/**
 * Initialize a board with default columns (no tasks)
 */
export async function initTestBoard(testBoard: TestBoard): Promise<void> {
  await mkdir(testBoard.boardPath, { recursive: true })

  for (const col of DEFAULT_COLUMNS) {
    const folderName = `${String(col.order).padStart(2, '0')}-${col.slug}`
    await mkdir(join(testBoard.boardPath, folderName))
  }
}

/**
 * Seed a board with sample tasks
 */
export async function seedTestBoard(testBoard: TestBoard): Promise<void> {
  await initTestBoard(testBoard)

  // Add sample tasks (columns: 01-backlog, 02-todo, 03-in-progress, 04-done)
  const tasks = [
    {
      column: '01-backlog',
      slug: 'implement-auth',
      content: `---
title: Implement user authentication
created: 2024-01-27
---

Add JWT-based authentication flow.

- [ ] Create login endpoint
- [x] Setup JWT middleware
- [ ] Add refresh token logic
`
    },
    {
      column: '01-backlog',
      slug: 'fix-header-bug',
      content: `---
title: Fix header alignment bug
created: 2024-01-26
---

The header is misaligned on mobile devices.
`
    },
    {
      column: '03-in-progress',
      slug: 'add-dark-mode',
      content: `---
title: Add dark mode support
created: 2024-01-25
---

Implement dark mode toggle in settings.
`
    },
    {
      column: '04-done',
      slug: 'setup-ci',
      content: `---
title: Setup CI pipeline
created: 2024-01-20
---

Configure GitHub Actions for CI/CD.
`
    }
  ]

  for (const task of tasks) {
    await writeFile(
      join(testBoard.boardPath, task.column, `${task.slug}.md`),
      task.content
    )
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    const { stat } = await import('fs/promises')
    await stat(path)
    return true
  } catch {
    return false
  }
}

/**
 * Check if a directory exists
 */
export async function dirExists(path: string): Promise<boolean> {
  try {
    const { stat } = await import('fs/promises')
    const stats = await stat(path)
    return stats.isDirectory()
  } catch {
    return false
  }
}
