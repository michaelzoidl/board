import { join } from 'path'
import { stat } from 'fs/promises'
import { BOARD_DIR, DEFAULT_PORT, MAX_PORT_ATTEMPTS } from '../../core/types.js'
import {
  writeLockFile,
  removeLockFile,
  findAvailablePort
} from '../utils/lock-file.js'
import { createServer } from '../../server/index.js'

export async function serveCommand(portArg?: string): Promise<void> {
  const cwd = process.cwd()
  const boardPath = join(cwd, BOARD_DIR)

  // Check if board exists
  try {
    await stat(boardPath)
  } catch {
    console.error(`No board found at ${BOARD_DIR}/`)
    console.error('Run `board init` to create one.')
    process.exit(1)
  }

  // Find available port
  let port: number
  const requestedPort = portArg ? parseInt(portArg, 10) : DEFAULT_PORT

  if (isNaN(requestedPort)) {
    console.error(`Invalid port: ${portArg}`)
    process.exit(1)
  }

  try {
    port = await findAvailablePort(requestedPort, MAX_PORT_ATTEMPTS)
  } catch (error) {
    console.error('Could not find an available port.')
    process.exit(1)
  }

  if (port !== requestedPort) {
    console.log(`Port ${requestedPort} in use, using ${port}`)
  }

  // Write lock file
  await writeLockFile(cwd, port)

  // Cleanup on exit
  const cleanup = async () => {
    await removeLockFile(cwd)
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  // Start server
  const server = await createServer(boardPath)
  await server.listen({ port, host: '127.0.0.1' })

  console.log('')
  console.log(`  Board server running at http://127.0.0.1:${port}`)
  console.log('')
  console.log(`  Board path: ${boardPath}`)
  console.log('')
  console.log('  Press Ctrl+C to stop')
  console.log('')
}
