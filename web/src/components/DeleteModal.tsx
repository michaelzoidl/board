import { useBoardStore } from '../store'

export function DeleteModal() {
  const deletingTask = useBoardStore((s) => s.deletingTask)
  const setDeletingTask = useBoardStore((s) => s.setDeletingTask)
  const deleteTask = useBoardStore((s) => s.deleteTask)

  if (!deletingTask) return null

  const handleConfirm = async () => {
    await deleteTask(deletingTask)
  }

  return (
    <div className="overlay" onClick={() => setDeletingTask(null)}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <h2>Delete Task</h2>
        <p>
          Are you sure you want to delete "<strong>{deletingTask.title}</strong>"?
          <br />
          <br />
          The file will be moved to your OS trash.
        </p>
        <div className="modal-btns">
          <button
            type="button"
            className="btn"
            onClick={() => setDeletingTask(null)}
          >
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
