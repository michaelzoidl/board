import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Column, Task, FilterType } from './types'
import * as api from './api'

interface BoardState {
  // Data
  columns: Column[]
  connected: boolean

  // UI state
  filters: Record<string, FilterType>
  addingToColumn: string | null
  deletingTask: Task | null
  editingTask: { task: Task; columnId: string } | null

  // Actions
  setColumns: (columns: Column[]) => void
  setConnected: (connected: boolean) => void
  setFilter: (columnId: string, filter: FilterType) => void
  setAddingToColumn: (columnId: string | null) => void
  setDeletingTask: (task: Task | null) => void
  setEditingTask: (data: { task: Task; columnId: string } | null) => void

  // Async actions
  loadBoard: () => Promise<void>
  createTask: (column: string, title: string, content: string) => Promise<void>
  updateTask: (column: string, slug: string, title: string, content: string) => Promise<void>
  deleteTask: (task: Task) => Promise<void>
  moveTask: (fromColumn: string, slug: string, toColumn: string) => Promise<void>
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set) => ({
      // Initial state
      columns: [],
      connected: false,
      filters: {},
      addingToColumn: null,
      deletingTask: null,
      editingTask: null,

      // Setters
      setColumns: (columns) => set({ columns }),
      setConnected: (connected) => set({ connected }),
      setFilter: (columnId, filter) =>
        set((state) => ({
          filters: { ...state.filters, [columnId]: filter }
        })),
      setAddingToColumn: (columnId) => set({ addingToColumn: columnId }),
      setDeletingTask: (task) => set({ deletingTask: task }),
      setEditingTask: (data) => set({ editingTask: data }),

      // Async actions
      loadBoard: async () => {
        const board = await api.fetchBoard()
        set({ columns: board.columns })
      },

      createTask: async (column, title, content) => {
        await api.createTask(column, title, content)
        // Board will update via WebSocket
      },

      updateTask: async (column, slug, title, content) => {
        await api.updateTask(column, slug, { title, content })
        set({ editingTask: null })
        // Board will update via WebSocket
      },

      deleteTask: async (task) => {
        const [column, slug] = task.id.split('/')
        await api.deleteTask(column, slug)
        set({ deletingTask: null })
        // Board will update via WebSocket
      },

      moveTask: async (fromColumn, slug, toColumn) => {
        await api.moveTask(fromColumn, slug, toColumn)
        // Board will update via WebSocket
      }
    }),
    {
      name: 'board-storage',
      partialize: (state) => ({ filters: state.filters })
    }
  )
)

// WebSocket connection
let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

export function connectWebSocket() {
  const { setColumns, setConnected } = useBoardStore.getState()
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

  ws = new WebSocket(`${proto}//${window.location.host}/ws`)

  ws.onopen = () => {
    setConnected(true)
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  ws.onclose = () => {
    setConnected(false)
    reconnectTimer = setTimeout(connectWebSocket, 2000)
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'sync') {
        setColumns(msg.data.columns)
      }
    } catch {
      // Ignore parse errors
    }
  }
}

// Date filter helpers
export function getDateRange(filter: FilterType): { start: Date; end: Date } | null {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (filter) {
    case 'today':
      return { start: today, end: new Date(today.getTime() + 86400000) }
    case 'yesterday': {
      const yesterday = new Date(today.getTime() - 86400000)
      return { start: yesterday, end: today }
    }
    case 'week': {
      const weekAgo = new Date(today.getTime() - 7 * 86400000)
      return { start: weekAgo, end: new Date(today.getTime() + 86400000) }
    }
    default:
      return null
  }
}

export function matchesFilter(task: Task, filter: FilterType): boolean {
  if (filter === 'all' || !filter) return true
  if (!task.created) return false

  const range = getDateRange(filter)
  if (!range) return true

  const taskDate = new Date(task.created)
  return taskDate >= range.start && taskDate < range.end
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (taskDate.getTime() === today.getTime()) return 'today'
  if (taskDate.getTime() === yesterday.getTime()) return 'yesterday'

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
