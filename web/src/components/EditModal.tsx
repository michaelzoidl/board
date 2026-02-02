import { useState, useEffect, useRef, useCallback } from 'react'
import { useBoardStore } from '../store'
import { MarkdownEditor } from './MarkdownEditor'

export function EditModal() {
  const editingTask = useBoardStore((s) => s.editingTask)
  const setEditingTask = useBoardStore((s) => s.setEditingTask)
  const updateTask = useBoardStore((s) => s.updateTask)

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!title.trim() || !editingTask) return
    await updateTask(editingTask.columnId, editingTask.task.slug, title, desc)
  }, [title, desc, editingTask, updateTask])

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.task.title)
      setDesc(editingTask.task.content || '')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [editingTask])

  // Keyboard shortcuts: Escape to close, Cmd/Ctrl+S to save
  useEffect(() => {
    if (!editingTask) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingTask(null)
      } else if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingTask, setEditingTask, handleSubmit])

  if (!editingTask) return null

  return (
    <div className="panel-overlay" onClick={() => setEditingTask(null)}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>Edit Task</h2>
          <button
            type="button"
            className="panel-close"
            onClick={() => setEditingTask(null)}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="panel-content">
          <label>Title</label>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
          />
          <label>Description</label>
          <MarkdownEditor
            value={desc}
            onChange={setDesc}
            placeholder="Add details... Use **bold**, *italic*, `code`, and @file to mention files"
          />
          <div className="panel-btns">
            <button
              type="button"
              className="btn"
              onClick={() => setEditingTask(null)}
            >
              Cancel <kbd>Esc</kbd>
            </button>
            <button type="submit" className="btn btn-primary">
              Save <kbd>⌘S</kbd>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
