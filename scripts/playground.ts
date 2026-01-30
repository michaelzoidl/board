#!/usr/bin/env tsx
/**
 * Playground script for manual testing
 *
 * Creates a temp directory with sample board data and starts the server.
 * Press Ctrl+C to stop and cleanup.
 */

import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { createServer } from '../src/server/index.js'

const BOARD_DIR = '.board'

async function createPlaygroundBoard(root: string): Promise<string> {
  const boardPath = join(root, BOARD_DIR)
  await mkdir(boardPath, { recursive: true })

  // Create columns (matches DEFAULT_COLUMNS in types.ts)
  const columns = [
    { folder: '01-backlog', name: 'Backlog' },
    { folder: '02-todo', name: 'Todo' },
    { folder: '03-in-progress', name: 'In Progress' },
    { folder: '04-done', name: 'Done' }
  ]

  for (const col of columns) {
    await mkdir(join(boardPath, col.folder))
  }

  // Get dates for testing filters
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]
  const lastWeek = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]

  // Create sample tasks
  const tasks = [
    {
      column: '01-backlog',
      slug: 'implement-auth',
      content: `---
title: Implement user authentication
created: ${today}
---

Add JWT-based authentication flow for the API.

## Acceptance Criteria

- [ ] Create login endpoint
- [ ] Setup JWT middleware
- [ ] Add refresh token logic
- [ ] Add logout endpoint
`
    },
    {
      column: '01-backlog',
      slug: 'add-search',
      content: `---
title: Add search functionality
created: ${yesterday}
---

Add a search bar to filter tasks across all columns.

- [ ] Add search input to header
- [ ] Implement fuzzy search
- [ ] Highlight matching text
`
    },
    {
      column: '01-backlog',
      slug: 'fix-mobile-layout',
      content: `---
title: Fix mobile layout issues
created: ${lastWeek}
---

The board doesn't scroll properly on mobile devices.
`
    },
    {
      column: '02-todo',
      slug: 'update-readme',
      content: `---
title: Update README documentation
created: ${today}
---

Update the README with new features and API changes.

- [x] Add installation instructions
- [x] Document CLI commands
- [ ] Add API reference
`
    },
    {
      column: '03-in-progress',
      slug: 'add-dark-mode',
      content: `---
title: Add dark mode support
created: ${threeDaysAgo}
---

Implement dark mode toggle in settings.

- [x] Design dark color palette
- [x] Add CSS variables
- [ ] Create theme toggle component
- [ ] Persist preference to localStorage
`
    },
    {
      column: '03-in-progress',
      slug: 'api-rate-limiting',
      content: `---
title: Implement API rate limiting
created: ${yesterday}
---

Add rate limiting to prevent API abuse using sliding window algorithm.
`
    },
    {
      column: '04-done',
      slug: 'setup-ci',
      content: `---
title: Setup CI/CD pipeline
created: ${today}
---

Configure GitHub Actions for automated testing and deployment.

- [x] Setup test workflow
- [x] Add linting
- [x] Configure deployment
`
    },
    {
      column: '04-done',
      slug: 'database-migrations',
      content: `---
title: Implement database migrations
created: ${twoWeeksAgo}
---

Set up database migration system using Drizzle. Migration files are in \`/migrations\` directory.
`
    }
  ]

  for (const task of tasks) {
    await writeFile(
      join(boardPath, task.column, `${task.slug}.md`),
      task.content
    )
  }

  return boardPath
}

// Create sample project files for @ mention testing
async function createSampleProjectFiles(root: string): Promise<void> {
  // Create src folder structure
  const srcPath = join(root, 'src')
  await mkdir(join(srcPath, 'components'), { recursive: true })
  await mkdir(join(srcPath, 'utils'), { recursive: true })
  await mkdir(join(srcPath, 'api'), { recursive: true })

  // Create sample files
  await writeFile(join(srcPath, 'index.ts'), '// Main entry point\nexport {}')
  await writeFile(join(srcPath, 'app.tsx'), '// App component\nexport function App() {}')
  await writeFile(join(srcPath, 'components', 'Button.tsx'), '// Button component')
  await writeFile(join(srcPath, 'components', 'Modal.tsx'), '// Modal component')
  await writeFile(join(srcPath, 'components', 'Card.tsx'), '// Card component')
  await writeFile(join(srcPath, 'utils', 'helpers.ts'), '// Helper functions')
  await writeFile(join(srcPath, 'utils', 'format.ts'), '// Formatting utilities')
  await writeFile(join(srcPath, 'api', 'client.ts'), '// API client')
  await writeFile(join(srcPath, 'api', 'types.ts'), '// API types')

  // Create config files
  await writeFile(join(root, 'package.json'), '{"name": "sample-project"}')
  await writeFile(join(root, 'tsconfig.json'), '{}')
  await writeFile(join(root, 'README.md'), '# Sample Project')
}

async function main() {
  console.log('🎮 Starting Board Playground\n')

  // Create temp directory
  const root = await mkdtemp(join(tmpdir(), 'board-playground-'))
  console.log(`📁 Created playground at: ${root}`)

  // Create sample project files for @ mentions
  await createSampleProjectFiles(root)

  // Create sample board
  const boardPath = await createPlaygroundBoard(root)
  console.log(`📋 Board path: ${boardPath}`)

  // Start server
  const port = 8042
  const server = await createServer(boardPath)
  await server.listen({ port, host: '127.0.0.1' })

  console.log('')
  console.log(`🚀 Server running at http://127.0.0.1:${port}`)
  console.log('')
  console.log('📝 Try these commands in another terminal:')
  console.log(`   cd ${root}`)
  console.log('   # Edit a task file and watch the GUI update!')
  console.log('')
  console.log('🛑 Press Ctrl+C to stop and cleanup')
  console.log('')

  // Cleanup on exit
  const cleanup = async () => {
    console.log('\n🧹 Cleaning up...')
    await server.close()
    await rm(root, { recursive: true, force: true })
    console.log('✅ Done!')
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
