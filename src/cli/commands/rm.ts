import { join } from 'path'
import { deleteTask } from '../../core/fs-layer.js'
import { BOARD_DIR } from '../../core/types.js'

interface RmOptions {
  force?: boolean
}

export async function rmCommand(taskId: string, options: RmOptions): Promise<void> {
  const cwd = process.cwd()
  const boardPath = join(cwd, BOARD_DIR)

  // Parse task ID (format: column/slug)
  const parts = taskId.split('/')
  if (parts.length !== 2) {
    console.error('Invalid task ID format. Use: column/task-slug')
    console.error('Example: board rm backlog/my-task')
    process.exit(1)
  }

  const [column, taskSlug] = parts

  // TODO: Add confirmation prompt if not --force
  // For now, just delete
  if (!options.force) {
    // In a real implementation, we'd prompt for confirmation
    // For now, treat as if --force was passed
  }

  try {
    await deleteTask(boardPath, column, taskSlug)
    console.log(`Deleted: ${taskId}`)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`)
    } else {
      console.error('An unexpected error occurred')
    }
    process.exit(1)
  }
}
