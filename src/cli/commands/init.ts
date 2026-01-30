import { join } from 'path'
import { stat } from 'fs/promises'
import { initBoard } from '../../core/fs-layer.js'
import { BOARD_DIR } from '../../core/types.js'

export async function initCommand(): Promise<void> {
  const cwd = process.cwd()
  const boardPath = join(cwd, BOARD_DIR)

  // Check if board already exists
  let exists = false
  try {
    await stat(boardPath)
    exists = true
  } catch {
    // Board doesn't exist
  }

  await initBoard(boardPath)

  if (exists) {
    console.log(`Board already exists at ${BOARD_DIR}/`)
    console.log('Added any missing default columns.')
  } else {
    console.log(`Initialized board at ${BOARD_DIR}/`)
    console.log('')
    console.log('Default columns created:')
    console.log('  01-backlog/')
    console.log('  02-in-progress/')
    console.log('  03-review/')
    console.log('  04-done/')
    console.log('')
    console.log('Run `board` to start the GUI, or `board add backlog "My first task"` to add a task.')
  }
}
