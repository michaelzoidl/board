# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run build        # Build web UI + CLI (required before testing the full app)
npm run build:cli    # Build CLI only
npm run dev          # Watch mode for CLI (tsup --watch)
npm run dev:web      # Watch mode for web UI (cd web && vite)
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run typecheck    # Type check without emitting
npm run link         # Build and npm link for local testing
npm run playground   # Run scripts/playground.ts for quick experiments
```

## Testing

Tests use Vitest with a helper module at [tests/helpers/test-board.ts](tests/helpers/test-board.ts) that creates isolated temp directories:

```typescript
import { createTestBoard, seedTestBoard } from '../helpers/test-board.js'

const testBoard = await createTestBoard()
await seedTestBoard(testBoard)  // Creates columns + sample tasks
// ... run tests ...
await testBoard.cleanup()
```

Run a single test file: `npx vitest run tests/unit/core/markdown.test.ts`

## Architecture

**File-based data model**: The `.board/` directory IS the database. Folders = columns, markdown files = tasks. Column order determined by folder prefix (e.g., `01-backlog`, `02-in-progress`).

**Three layers**:
- `src/core/` - Pure functions for file I/O and markdown parsing. `fs-layer.ts` handles all CRUD operations, `markdown.ts` handles frontmatter (via gray-matter).
- `src/cli/` - Commander-based CLI. Each command in `commands/` folder. Default action is `serve`.
- `src/server/` - Fastify server with REST API (`routes.ts`) and WebSocket (`websocket.ts`) for real-time sync. File watcher (`core/watcher.ts`) broadcasts changes.

**Web UI** (`web/`): Separate Vite + React app using Zustand for state. Built to `web/dist/` which gets bundled with the CLI package.

## Key Conventions

- Commits use semantic format: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Task IDs follow format: `{column-slug}/{task-slug}` (e.g., `backlog/fix-bug`)
- Column folders must match pattern: `{order}-{slug}` (e.g., `01-backlog`)
- All source uses ESM (`"type": "module"`) with `.js` extensions in imports
- Server default port: 8042 (increments if busy)
