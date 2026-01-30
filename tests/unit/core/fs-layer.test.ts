import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import { readFile } from 'fs/promises'
import {
  createTestBoard,
  initTestBoard,
  seedTestBoard,
  fileExists,
  dirExists,
  type TestBoard
} from '../../helpers/test-board.js'
import {
  readBoard,
  readColumn,
  readTask,
  writeTask,
  deleteTask,
  moveTask,
  createColumn,
  deleteColumn,
  renameColumn,
  initBoard
} from '../../../src/core/fs-layer.js'

describe('fs-layer', () => {
  let testBoard: TestBoard

  beforeEach(async () => {
    testBoard = await createTestBoard()
  })

  afterEach(async () => {
    await testBoard.cleanup()
  })

  describe('initBoard', () => {
    it('creates .board directory with default columns', async () => {
      await initBoard(testBoard.boardPath)

      expect(await dirExists(testBoard.boardPath)).toBe(true)
      expect(await dirExists(join(testBoard.boardPath, '01-backlog'))).toBe(true)
      expect(await dirExists(join(testBoard.boardPath, '02-todo'))).toBe(true)
      expect(await dirExists(join(testBoard.boardPath, '03-in-progress'))).toBe(true)
      expect(await dirExists(join(testBoard.boardPath, '04-done'))).toBe(true)
    })

    it('does not overwrite existing board', async () => {
      await initTestBoard(testBoard)
      await writeTask(testBoard.boardPath, 'backlog', {
        title: 'Existing task',
        content: 'Should not be deleted'
      })

      await initBoard(testBoard.boardPath)

      expect(await fileExists(join(testBoard.boardPath, '01-backlog', 'existing-task.md'))).toBe(true)
    })
  })

  describe('readBoard', () => {
    it('reads empty board', async () => {
      await initTestBoard(testBoard)

      const board = await readBoard(testBoard.boardPath)

      expect(board.columns).toHaveLength(4)
      expect(board.columns[0].id).toBe('backlog')
      expect(board.columns[0].name).toBe('Backlog')
      expect(board.columns[0].order).toBe(1)
      expect(board.columns[0].tasks).toHaveLength(0)
    })

    it('reads board with tasks', async () => {
      await seedTestBoard(testBoard)

      const board = await readBoard(testBoard.boardPath)

      expect(board.columns).toHaveLength(4)

      const backlog = board.columns.find(c => c.id === 'backlog')
      expect(backlog?.tasks).toHaveLength(2)
      const backlogTitles = backlog?.tasks.map(t => t.title)
      expect(backlogTitles).toContain('Implement user authentication')
      expect(backlogTitles).toContain('Fix header alignment bug')

      const inProgress = board.columns.find(c => c.id === 'in-progress')
      expect(inProgress?.tasks).toHaveLength(1)
      expect(inProgress?.tasks[0].title).toBe('Add dark mode support')
    })

    it('returns columns sorted by order', async () => {
      await seedTestBoard(testBoard)

      const board = await readBoard(testBoard.boardPath)

      expect(board.columns[0].order).toBe(1)
      expect(board.columns[1].order).toBe(2)
      expect(board.columns[2].order).toBe(3)
      expect(board.columns[3].order).toBe(4)
    })

    it('throws if board does not exist', async () => {
      await expect(readBoard(testBoard.boardPath)).rejects.toThrow()
    })
  })

  describe('readColumn', () => {
    it('reads a single column', async () => {
      await seedTestBoard(testBoard)

      const column = await readColumn(testBoard.boardPath, 'backlog')

      expect(column.id).toBe('backlog')
      expect(column.tasks).toHaveLength(2)
    })

    it('throws if column does not exist', async () => {
      await initTestBoard(testBoard)

      await expect(readColumn(testBoard.boardPath, 'nonexistent')).rejects.toThrow()
    })
  })

  describe('readTask', () => {
    it('reads a single task', async () => {
      await seedTestBoard(testBoard)

      const task = await readTask(testBoard.boardPath, 'backlog', 'implement-auth')

      expect(task.id).toBe('backlog/implement-auth')
      expect(task.title).toBe('Implement user authentication')
      expect(task.created).toBe('2024-01-27')
    })

    it('throws if task does not exist', async () => {
      await initTestBoard(testBoard)

      await expect(readTask(testBoard.boardPath, 'backlog', 'nonexistent')).rejects.toThrow()
    })
  })

  describe('writeTask', () => {
    it('creates a new task', async () => {
      await initTestBoard(testBoard)

      const task = await writeTask(testBoard.boardPath, 'backlog', {
        title: 'New task',
        priority: 'medium',
        tags: ['test'],
        content: '## Description\n\nTest content.'
      })

      expect(task.id).toBe('backlog/new-task')
      expect(task.slug).toBe('new-task')
      expect(await fileExists(join(testBoard.boardPath, '01-backlog', 'new-task.md'))).toBe(true)
    })

    it('generates slug from title', async () => {
      await initTestBoard(testBoard)

      const task = await writeTask(testBoard.boardPath, 'backlog', {
        title: 'My Awesome Task!'
      })

      expect(task.slug).toBe('my-awesome-task')
    })

    it('updates existing task', async () => {
      await seedTestBoard(testBoard)

      const task = await writeTask(testBoard.boardPath, 'backlog', {
        title: 'Updated title',
        content: 'Updated content'
      }, 'implement-auth')

      expect(task.title).toBe('Updated title')

      // Read back and verify
      const read = await readTask(testBoard.boardPath, 'backlog', 'implement-auth')
      expect(read.title).toBe('Updated title')
    })

    it('sets created date on new tasks', async () => {
      await initTestBoard(testBoard)

      const task = await writeTask(testBoard.boardPath, 'backlog', {
        title: 'Task with date'
      })

      expect(task.created).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('deleteTask', () => {
    it('deletes a task', async () => {
      await seedTestBoard(testBoard)

      await deleteTask(testBoard.boardPath, 'backlog', 'implement-auth')

      expect(await fileExists(join(testBoard.boardPath, '01-backlog', 'implement-auth.md'))).toBe(false)
    })

    it('throws if task does not exist', async () => {
      await initTestBoard(testBoard)

      await expect(deleteTask(testBoard.boardPath, 'backlog', 'nonexistent')).rejects.toThrow()
    })
  })

  describe('moveTask', () => {
    it('moves task to another column', async () => {
      await seedTestBoard(testBoard)

      const task = await moveTask(testBoard.boardPath, 'backlog', 'implement-auth', 'in-progress')

      expect(task.id).toBe('in-progress/implement-auth')
      expect(await fileExists(join(testBoard.boardPath, '01-backlog', 'implement-auth.md'))).toBe(false)
      expect(await fileExists(join(testBoard.boardPath, '03-in-progress', 'implement-auth.md'))).toBe(true)
    })

    it('throws if target column does not exist', async () => {
      await seedTestBoard(testBoard)

      await expect(
        moveTask(testBoard.boardPath, 'backlog', 'implement-auth', 'nonexistent')
      ).rejects.toThrow()
    })
  })

  describe('createColumn', () => {
    it('creates a new column', async () => {
      await initTestBoard(testBoard)

      const column = await createColumn(testBoard.boardPath, 'Testing')

      expect(column.id).toBe('testing')
      expect(column.name).toBe('Testing')
      expect(column.order).toBe(5) // After 4 default columns
      expect(await dirExists(join(testBoard.boardPath, '05-testing'))).toBe(true)
    })

    it('throws if column already exists', async () => {
      await initTestBoard(testBoard)

      await expect(createColumn(testBoard.boardPath, 'Backlog')).rejects.toThrow()
    })
  })

  describe('deleteColumn', () => {
    it('deletes an empty column', async () => {
      await initTestBoard(testBoard)

      await deleteColumn(testBoard.boardPath, 'todo')

      expect(await dirExists(join(testBoard.boardPath, '02-todo'))).toBe(false)
    })

    it('throws if column has tasks', async () => {
      await seedTestBoard(testBoard)

      await expect(deleteColumn(testBoard.boardPath, 'backlog')).rejects.toThrow()
    })

    it('throws if column does not exist', async () => {
      await initTestBoard(testBoard)

      await expect(deleteColumn(testBoard.boardPath, 'nonexistent')).rejects.toThrow()
    })
  })

  describe('renameColumn', () => {
    it('renames a column', async () => {
      await initTestBoard(testBoard)

      const column = await renameColumn(testBoard.boardPath, 'backlog', 'Todo')

      expect(column.id).toBe('todo')
      expect(column.name).toBe('Todo')
      expect(await dirExists(join(testBoard.boardPath, '01-backlog'))).toBe(false)
      expect(await dirExists(join(testBoard.boardPath, '01-todo'))).toBe(true)
    })

    it('preserves tasks when renaming', async () => {
      await seedTestBoard(testBoard)

      await renameColumn(testBoard.boardPath, 'backlog', 'Todo')

      expect(await fileExists(join(testBoard.boardPath, '01-todo', 'implement-auth.md'))).toBe(true)
    })
  })
})
