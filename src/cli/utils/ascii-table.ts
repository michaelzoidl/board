import type { Board, Task } from '../../core/types.js'

const BOX = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  cross: '┼',
  topT: '┬',
  bottomT: '┴',
  leftT: '├',
  rightT: '┤'
}

const PRIORITY_ICONS: Record<string, string> = {
  high: '●',
  medium: '◐',
  low: '○'
}

/**
 * Render a board as an ASCII table
 */
export function renderBoardTable(board: Board): string {
  const columns = board.columns
  const colWidth = 20

  // Calculate max tasks in any column
  const maxTasks = Math.max(...columns.map(c => c.tasks.length), 1)

  const lines: string[] = []

  // Top border
  lines.push(
    BOX.topLeft +
    columns.map(() => BOX.horizontal.repeat(colWidth)).join(BOX.topT) +
    BOX.topRight
  )

  // Header row
  const headers = columns.map(col => {
    const taskCount = col.tasks.length
    const header = `${col.name} (${taskCount})`
    return centerPad(header, colWidth)
  })
  lines.push(BOX.vertical + headers.join(BOX.vertical) + BOX.vertical)

  // Header separator
  lines.push(
    BOX.leftT +
    columns.map(() => BOX.horizontal.repeat(colWidth)).join(BOX.cross) +
    BOX.rightT
  )

  // Task rows
  for (let i = 0; i < maxTasks; i++) {
    const cells = columns.map(col => {
      const task = col.tasks[i]
      if (!task) {
        return ' '.repeat(colWidth)
      }
      return formatTask(task, colWidth)
    })
    lines.push(BOX.vertical + cells.join(BOX.vertical) + BOX.vertical)
  }

  // Bottom border
  lines.push(
    BOX.bottomLeft +
    columns.map(() => BOX.horizontal.repeat(colWidth)).join(BOX.bottomT) +
    BOX.bottomRight
  )

  return lines.join('\n')
}

function formatTask(task: Task, width: number): string {
  const icon = task.priority ? PRIORITY_ICONS[task.priority] || '' : ''
  const prefix = icon ? `${icon} ` : ''
  const maxLen = width - 2 - prefix.length

  let title = task.title
  if (title.length > maxLen) {
    title = title.slice(0, maxLen - 1) + '…'
  }

  const content = prefix + title
  return ' ' + content.padEnd(width - 2) + ' '
}

function centerPad(str: string, width: number): string {
  if (str.length >= width) {
    return str.slice(0, width)
  }
  const left = Math.floor((width - str.length) / 2)
  const right = width - str.length - left
  return ' '.repeat(left) + str + ' '.repeat(right)
}

/**
 * Render a simple status table for running servers
 */
export function renderStatusTable(
  servers: Array<{ path: string; port: number; url: string }>
): string {
  if (servers.length === 0) {
    return 'No board servers currently running.'
  }

  const pathWidth = 35
  const portWidth = 7
  const urlWidth = 30

  const lines: string[] = []

  // Top border
  lines.push(
    BOX.topLeft +
    BOX.horizontal.repeat(pathWidth) +
    BOX.topT +
    BOX.horizontal.repeat(portWidth) +
    BOX.topT +
    BOX.horizontal.repeat(urlWidth) +
    BOX.topRight
  )

  // Header
  lines.push(
    BOX.vertical +
    centerPad('Project', pathWidth) +
    BOX.vertical +
    centerPad('Port', portWidth) +
    BOX.vertical +
    centerPad('URL', urlWidth) +
    BOX.vertical
  )

  // Header separator
  lines.push(
    BOX.leftT +
    BOX.horizontal.repeat(pathWidth) +
    BOX.cross +
    BOX.horizontal.repeat(portWidth) +
    BOX.cross +
    BOX.horizontal.repeat(urlWidth) +
    BOX.rightT
  )

  // Server rows
  for (const server of servers) {
    const path = truncate(server.path, pathWidth - 2)
    const port = String(server.port)
    const url = truncate(server.url, urlWidth - 2)

    lines.push(
      BOX.vertical +
      ' ' + path.padEnd(pathWidth - 2) + ' ' +
      BOX.vertical +
      ' ' + port.padEnd(portWidth - 2) + ' ' +
      BOX.vertical +
      ' ' + url.padEnd(urlWidth - 2) + ' ' +
      BOX.vertical
    )
  }

  // Bottom border
  lines.push(
    BOX.bottomLeft +
    BOX.horizontal.repeat(pathWidth) +
    BOX.bottomT +
    BOX.horizontal.repeat(portWidth) +
    BOX.bottomT +
    BOX.horizontal.repeat(urlWidth) +
    BOX.bottomRight
  )

  lines.push('')
  lines.push(`${servers.length} board server(s) running`)

  return lines.join('\n')
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + '…'
}
