import { Calendar } from 'lucide-react'
import { formatDate, isOverdue, toDateInput } from '../../lib/taskConstants'

export default function DueDatePicker({ task, canEdit, onChange }) {
  const overdue = isOverdue(task)

  return (
    <label
      onClick={(e) => e.stopPropagation()}
      className={`relative inline-flex items-center gap-3 rounded-md p-1 ${canEdit ? 'cursor-pointer hover:bg-white/10' : ''}`}
    >
      {task.dueDate ? (
        <>
          <span className={`flex h-8 w-8 items-center justify-center rounded-full border ${overdue ? 'border-red-500 text-red-400' : 'border-green-500 text-green-400'}`}>
            <Calendar className="h-4 w-4" />
          </span>
          <span className={`text-sm ${overdue ? 'text-red-400' : 'text-green-400'}`}>{formatDate(task.dueDate)}</span>
        </>
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-500 text-slate-500">
          <Calendar className="h-4 w-4" />
        </span>
      )}
      {canEdit && (
        <input
          type="date"
          value={toDateInput(task.dueDate)}
          onClick={(e) => e.currentTarget.showPicker?.()}
          onChange={(e) => onChange(e.target.value || null)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      )}
    </label>
  )
}
