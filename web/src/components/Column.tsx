import { useState } from 'react'
import type { Column as ColumnType, FilterType } from '../types'
import { FILTER_LABELS } from '../types'
import { useBoardStore, matchesFilter } from '../store'
import { Task } from './Task'
import { FilterDropdown } from './FilterDropdown'

interface ColumnProps {
  column: ColumnType
}

export function Column({ column }: ColumnProps) {
  const [over, setOver] = useState(false)
  const filters = useBoardStore((s) => s.filters)
  const setAddingToColumn = useBoardStore((s) => s.setAddingToColumn)
  const moveTask = useBoardStore((s) => s.moveTask)

  const filter = (filters[column.id] || 'all') as FilterType
  const filteredTasks = column.tasks.filter((t) => matchesFilter(t, filter))

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setOver(false)
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (data.column !== column.id) {
        await moveTask(data.column, data.slug, column.id)
      }
    } catch {
      // Ignore errors
    }
  }

  return (
    <div
      className={`column ${over ? 'over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
    >
      <div className="column-head">
        <div className="column-left">
          <span className="column-name">{column.name}</span>
          <span className="column-count">
            {filteredTasks.length}
            {filter !== 'all' && `/${column.tasks.length}`}
          </span>
        </div>
        <div className="column-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setAddingToColumn(column.id)}
            title="Add task"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <FilterDropdown columnId={column.id} filter={filter} />
        </div>
      </div>
      <div className="tasks">
        {filteredTasks.length === 0 && (
          <div className="empty">
            {filter === 'all'
              ? 'No tasks'
              : `No tasks for ${FILTER_LABELS[filter].toLowerCase()}`}
          </div>
        )}
        {filteredTasks.map((task) => (
          <Task key={task.id} task={task} columnId={column.id} />
        ))}
      </div>
      <button className="add-btn" onClick={() => setAddingToColumn(column.id)}>
        + Add
      </button>
    </div>
  )
}
