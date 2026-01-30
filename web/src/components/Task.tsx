import { useState } from 'react'
import type { Task as TaskType } from '../types'
import { useBoardStore, formatDate } from '../store'

interface TaskProps {
  task: TaskType
  columnId: string
}

export function Task({ task, columnId }: TaskProps) {
  const [dragging, setDragging] = useState(false)
  const setDeletingTask = useBoardStore((s) => s.setDeletingTask)
  const setEditingTask = useBoardStore((s) => s.setEditingTask)

  const handleDragStart = (e: React.DragEvent) => {
    setDragging(true)
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ column: columnId, slug: task.slug })
    )
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleClick = () => {
    setEditingTask({ task, columnId })
  }

  return (
    <div
      className={`task ${dragging ? 'dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setDragging(false)}
      onClick={handleClick}
    >
      <div className="task-header">
        <div className="task-title">{task.title}</div>
        <button
          className="task-delete"
          onClick={(e) => {
            e.stopPropagation()
            setDeletingTask(task)
          }}
          title="Delete task"
        >
          ×
        </button>
      </div>
      {task.content && <div className="task-desc">{task.content}</div>}
      {task.created && <div className="task-date">{formatDate(task.created)}</div>}
    </div>
  )
}
