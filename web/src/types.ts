export interface Task {
  id: string
  slug: string
  title: string
  created?: string
  tags: string[]
  content: string
}

export interface Column {
  id: string
  name: string
  order: number
  tasks: Task[]
}

export interface Board {
  columns: Column[]
}

export type FilterType = 'all' | 'today' | 'yesterday' | 'week'

export const FILTER_LABELS: Record<FilterType, string> = {
  all: 'All',
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'This Week'
}
