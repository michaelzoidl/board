import { useState, useEffect, useRef, useCallback } from 'react'
import { useBoardStore } from '../store'
import { MarkdownEditor } from './MarkdownEditor'

export function AddModal() {
  const addingToColumn = useBoardStore((s) => s.addingToColumn)
  const setAddingToColumn = useBoardStore((s) => s.setAddingToColumn)
  const createTask = useBoardStore((s) => s.createTask)

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!title.trim() || !addingToColumn) return
    await createTask(addingToColumn, title, desc)
    setAddingToColumn(null)
  }, [title, desc, addingToColumn, createTask, setAddingToColumn])

  useEffect(() => {
    if (addingToColumn) {
      setTitle('')
      setDesc('')
      inputRef.current?.focus()
    }
  }, [addingToColumn])

  // Keyboard shortcuts: Escape to close, Cmd/Ctrl+S to save
  useEffect(() => {
    if (!addingToColumn) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAddingToColumn(null)
      } else if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [addingToColumn, setAddingToColumn, handleSubmit])

  if (!addingToColumn) return null

  return (
    <div className="overlay" onClick={() => setAddingToColumn(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New Task</h2>
        <form onSubmit={handleSubmit}>
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
          <div className="modal-btns">
            <button
              type="button"
              className="btn"
              onClick={() => setAddingToColumn(null)}
            >
              Cancel <kbd>Esc</kbd>
            </button>
            <button type="submit" className="btn btn-primary">
              Create <kbd>⌘S</kbd>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
