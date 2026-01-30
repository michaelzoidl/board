# 📋 useboard

> A file-based kanban board that lives in your project. Folders are columns, markdown files are tasks.

```
.board/
├── 01-backlog/
│   └── implement-auth.md
├── 02-in-progress/
│   └── add-dark-mode.md
└── 03-done/
    └── setup-ci.md
```

## ✨ Why useboard?

| | |
|---|---|
| 🔀 **Git-friendly** | Commit your board, branch it, merge it |
| 🤖 **AI-friendly** | Claude, Copilot, or any AI can manipulate files directly |
| ✏️ **Human-friendly** | Edit tasks in your favorite editor |
| ⚡ **Zero-config** | Just `npx useboard init` and go |

## 📦 Install

```bash
npm install -g useboard
```

Or use directly with npx:

```bash
npx useboard
```

## 🚀 Quick Start

```bash
# Initialize board in current project
board init

# Open web UI
board
# → Server running at http://127.0.0.1:8042
```

## 🛠️ CLI Commands

| Command | Description |
|---------|-------------|
| `board` | 🌐 Start web UI (default) |
| `board init` | 📁 Create `.board/` with default columns |
| `board add <column> <title>` | ➕ Add a task from terminal |
| `board list` | 📋 Print board as ASCII table |
| `board mv <task-id> <column>` | 🔄 Move task to column |
| `board rm <task-id>` | 🗑️ Delete a task |
| `board status` | 📊 Show running board servers |
| `board --port <port>` | 🔌 Use specific port |

### Examples

```bash
# Add a task
board add backlog "Fix login bug"
# → Created: .board/01-backlog/fix-login-bug.md

# List all tasks
board list
# ┌─────────────┬───────────────┬────────────┐
# │ Backlog     │ In Progress   │ Done       │
# ├─────────────┼───────────────┼────────────┤
# │ Fix login   │ Add dark mode │ Setup CI   │
# └─────────────┴───────────────┴────────────┘

# Move a task
board mv backlog/fix-login-bug in-progress

# Delete a task
board rm done/setup-ci
```

## 🖥️ Web UI

The web interface features:

- 🖱️ **Drag & drop** - Move tasks between columns
- ⚡ **Real-time sync** - File changes reflect instantly
- 📝 **Markdown editor** - Edit task content with formatting
- 📎 **@ mentions** - Reference project files with `@filename`
- ⌨️ **Keyboard shortcuts** - `Esc` to close, `⌘S` to save

## 📄 Task Format

Tasks are markdown files with YAML frontmatter:

```markdown
---
title: Implement user authentication
priority: high
created: 2024-01-27
tags: [backend, security]
---

Add JWT-based authentication flow.

## Checklist

- [ ] Create login endpoint
- [x] Setup JWT middleware
- [ ] Add refresh token logic
```

## 🔢 Multi-Project Support

Run multiple boards simultaneously - each gets its own port:

```bash
# Terminal 1
cd ~/project-a && board
# → Server running at http://127.0.0.1:8042

# Terminal 2
cd ~/project-b && board
# → Server running at http://127.0.0.1:8043
```

Check all running boards:

```bash
board status
```

## 🤖 AI Integration

useboard is designed to work with AI tools. They can:

1. **Edit files directly** - Create/modify `.board/**/*.md` files
2. **Use the REST API** - `POST /api/tasks`, `PATCH /api/tasks/:id`, etc.
3. **Run CLI commands** - `board add`, `board mv`, etc.

The web UI hot-reloads when files change, so AI edits appear instantly.

## 🧑‍💻 Development

```bash
# Install dependencies
npm install

# Build everything
npm run build

# Run in development
npm run dev

# Run tests
npm test

# Link globally for testing
npm run link
```

## 🔍 Vibecheck

This project is written with **Claude Code (Opus)** but manually reviewed by humans. The codebase undergoes regular reviews for clean code practices, refactoring opportunities, and improvements are continuously made to maintain quality. See [CLAUDE.md](CLAUDE.md) for AI coding guidelines.

## 📄 License

MIT
