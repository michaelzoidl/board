import { useState, useEffect, useRef } from 'react'
import type { FilterType } from '../types'
import { FILTER_LABELS } from '../types'
import { useBoardStore } from '../store'

const FILTERS: FilterType[] = ['all', 'today', 'yesterday', 'week']

interface FilterDropdownProps {
  columnId: string
  filter: FilterType
}

export function FilterDropdown({ columnId, filter }: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const setFilter = useBoardStore((s) => s.setFilter)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const hasFilter = filter && filter !== 'all'

  return (
    <div className="filter-wrap" ref={ref}>
      <button
        className={`filter-toggle ${open ? 'active' : ''} ${hasFilter ? 'has-filter' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {hasFilter && <span>{FILTER_LABELS[filter]}</span>}
      </button>
      {open && (
        <div className="filter-dropdown">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-option ${filter === f ? 'active' : ''}`}
              onClick={() => {
                setFilter(columnId, f)
                setOpen(false)
              }}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
