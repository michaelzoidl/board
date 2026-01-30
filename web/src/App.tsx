import { useEffect } from 'react'
import { useBoardStore, connectWebSocket } from './store'
import { Column, AddModal, EditModal, DeleteModal } from './components'

export function App() {
  const columns = useBoardStore((s) => s.columns)
  const connected = useBoardStore((s) => s.connected)
  const loadBoard = useBoardStore((s) => s.loadBoard)

  useEffect(() => {
    loadBoard()
    connectWebSocket()
  }, [loadBoard])

  if (columns.length === 0) {
    return <div className="loading">loading...</div>
  }

  return (
    <>
      <header>
        <h1>board</h1>
        <div className="status">
          <span className={`status-dot ${connected ? 'on' : ''}`} />
          {connected ? 'synced' : 'connecting...'}
        </div>
      </header>
      <main>
        <div className="board">
          {columns.map((column) => (
            <Column key={column.id} column={column} />
          ))}
        </div>
      </main>
      <AddModal />
      <EditModal />
      <DeleteModal />
    </>
  )
}
