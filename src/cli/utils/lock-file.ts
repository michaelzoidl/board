import { readdir, readFile, writeFile, rm, mkdir, stat } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { createHash } from 'crypto'
import type { LockFileData } from '../../core/types.js'
import { LOCK_DIR } from '../../core/types.js'

/**
 * Get the lock files directory path
 */
export function getLockDir(): string {
  return join(homedir(), LOCK_DIR)
}

/**
 * Generate a lock file name from a project path
 */
export function getLockFileName(projectPath: string): string {
  // Use a hash of the path to create a unique, filesystem-safe name
  const hash = createHash('md5').update(projectPath).digest('hex').slice(0, 12)
  const safeName = projectPath
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(-30)
  return `${safeName}-${hash}.lock`
}

/**
 * Write a lock file for a running server
 */
export async function writeLockFile(projectPath: string, port: number): Promise<void> {
  const lockDir = getLockDir()
  await mkdir(lockDir, { recursive: true })

  const data: LockFileData = {
    port,
    path: projectPath,
    pid: process.pid,
    started: new Date().toISOString()
  }

  const lockFile = join(lockDir, getLockFileName(projectPath))
  await writeFile(lockFile, JSON.stringify(data, null, 2))
}

/**
 * Remove a lock file
 */
export async function removeLockFile(projectPath: string): Promise<void> {
  const lockFile = join(getLockDir(), getLockFileName(projectPath))
  try {
    await rm(lockFile)
  } catch {
    // Ignore if file doesn't exist
  }
}

/**
 * Read all lock files and return active servers
 */
export async function getRunningServers(): Promise<LockFileData[]> {
  const lockDir = getLockDir()

  try {
    await stat(lockDir)
  } catch {
    return []
  }

  const files = await readdir(lockDir)
  const servers: LockFileData[] = []

  for (const file of files) {
    if (!file.endsWith('.lock')) continue

    const filePath = join(lockDir, file)

    try {
      const content = await readFile(filePath, 'utf-8')
      const data: LockFileData = JSON.parse(content)

      // Check if process is still running
      if (isProcessRunning(data.pid)) {
        servers.push(data)
      } else {
        // Clean up stale lock file
        await rm(filePath)
      }
    } catch {
      // Invalid lock file, remove it
      try {
        await rm(filePath)
      } catch {
        // Ignore
      }
    }
  }

  return servers
}

/**
 * Check if a process is running
 */
function isProcessRunning(pid: number): boolean {
  try {
    // Sending signal 0 doesn't kill the process, just checks if it exists
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/**
 * Find an available port starting from the default
 */
export async function findAvailablePort(startPort: number, maxAttempts: number): Promise<number> {
  const { createServer } = await import('net')

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const port = startPort + attempt
    const available = await isPortAvailable(port)
    if (available) {
      return port
    }
  }

  throw new Error(`Could not find available port after ${maxAttempts} attempts`)
}

/**
 * Check if a port is available
 */
async function isPortAvailable(port: number): Promise<boolean> {
  const { createServer } = await import('net')

  return new Promise((resolve) => {
    const server = createServer()

    server.once('error', () => {
      resolve(false)
    })

    server.once('listening', () => {
      // Wait for close to complete before resolving to avoid race condition
      server.close(() => {
        resolve(true)
      })
    })

    server.listen(port, '127.0.0.1')
  })
}
