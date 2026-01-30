import { join } from 'path'
import { readBoard } from '../../core/fs-layer.js'
import { BOARD_DIR } from '../../core/types.js'
import { renderBoardTable } from '../utils/ascii-table.js'

export async function listCommand(): Promise<void> {
  const cwd = process.cwd()
  const boardPath = join(cwd, BOARD_DIR)

  try {
    const board = await readBoard(boardPath)

    if (board.columns.length === 0) {
      console.log('No columns found. Run `board init` to create a board.')
      return
    }

    const totalTasks = board.columns.reduce((sum, col) => sum + col.tasks.length, 0)

    if (totalTasks === 0) {
      console.log('Board is empty. Run `board add <column> "<title>"` to add a task.')
      console.log('')
      console.log('Columns:')
      for (const col of board.columns) {
        console.log(`  ${col.name}`)
      }
      return
    }

    console.log(renderBoardTable(board))
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      console.error('No board found. Run `board init` to create one.')
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`)
    } else {
      console.error('An unexpected error occurred')
    }
    process.exit(1)
  }
}
