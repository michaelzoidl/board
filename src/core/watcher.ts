import chokidar from 'chokidar'

export type WatchCallback = (event: 'add' | 'change' | 'unlink', path: string) => void

/**
 * Create a file watcher for the board directory
 */
export function createWatcher(boardPath: string, callback: WatchCallback): chokidar.FSWatcher {
  const watcher = chokidar.watch(boardPath, {
    ignoreInitial: true,
    // Debounce rapid changes
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50
    },
    // Only watch markdown files and directories
    ignored: (path) => {
      // Always watch directories
      if (!path.includes('.')) return false
      // Only watch .md files
      return !path.endsWith('.md')
    }
  })

  watcher.on('add', (path) => callback('add', path))
  watcher.on('change', (path) => callback('change', path))
  watcher.on('unlink', (path) => callback('unlink', path))
  watcher.on('addDir', (path) => callback('add', path))
  watcher.on('unlinkDir', (path) => callback('unlink', path))

  return watcher
}
