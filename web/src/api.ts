import type { Board, Task } from './types'

const BASE_URL = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  return res.json()
}

export async function fetchBoard(): Promise<Board> {
  return request<Board>('/board')
}

export async function fetchFiles(query: string): Promise<{ files: string[] }> {
  return request<{ files: string[] }>(`/files?q=${encodeURIComponent(query)}`)
}

export async function createTask(
  column: string,
  title: string,
  content?: string
): Promise<Task> {
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify({ column, title, content })
  })
}

export async function updateTask(
  column: string,
  slug: string,
  updates: { title?: string; content?: string; column?: string }
): Promise<Task> {
  return request<Task>(`/tasks/${column}/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  })
}

export async function deleteTask(column: string, slug: string): Promise<void> {
  await request(`/tasks/${column}/${slug}`, { method: 'DELETE' })
}

export async function moveTask(
  fromColumn: string,
  slug: string,
  toColumn: string
): Promise<Task> {
  return request<Task>(`/tasks/${fromColumn}/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify({ column: toColumn })
  })
}
