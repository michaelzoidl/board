import { join } from 'path'
import { moveTask } from '../../core/fs-layer.js'
import { BOARD_DIR } from '../../core/types.js'

export async function mvCommand(taskId: string, targetColumn: string): Promise<void> {
  const cwd = process.cwd()
  const boardPath = join(cwd, BOARD_DIR)

  // Parse task ID (format: column/slug)
  const parts = taskId.split('/')
  if (parts.length !== 2) {
    console.error('Invalid task ID format. Use: column/task-slug')
    console.error('Example: board mv backlog/my-task in-progress')
    process.exit(1)
  }

  const [sourceColumn, taskSlug] = parts

  try {
    const task = await moveTask(boardPath, sourceColumn, taskSlug, targetColumn)
    console.log(`Moved: ${sourceColumn}/${taskSlug} → ${task.id}`)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`)
    } else {
      console.error('An unexpected error occurred')
    }
    process.exit(1)
  }
}
