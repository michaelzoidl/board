import { join } from 'path'
import { writeTask } from '../../core/fs-layer.js'
import { BOARD_DIR, type Priority } from '../../core/types.js'

interface AddOptions {
  priority?: string
  tags?: string
}

export async function addCommand(
  column: string,
  title: string,
  options: AddOptions
): Promise<void> {
  const cwd = process.cwd()
  const boardPath = join(cwd, BOARD_DIR)

  // Parse priority
  let priority: Priority | undefined
  if (options.priority) {
    if (['low', 'medium', 'high'].includes(options.priority)) {
      priority = options.priority as Priority
    } else {
      console.error(`Invalid priority: ${options.priority}`)
      console.error('Valid values: low, medium, high')
      process.exit(1)
    }
  }

  // Parse tags
  const tags = options.tags
    ? options.tags.split(',').map(t => t.trim()).filter(Boolean)
    : undefined

  try {
    const task = await writeTask(boardPath, column, {
      title,
      priority,
      tags,
      content: ''
    })

    console.log(`Created: ${BOARD_DIR}/${column}/${task.slug}.md`)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`)
    } else {
      console.error('An unexpected error occurred')
    }
    process.exit(1)
  }
}
