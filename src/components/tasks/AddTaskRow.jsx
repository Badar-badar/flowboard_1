import { useState } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import { CircleCheck } from 'lucide-react'
import { formatDate } from '../../lib/taskConstants'

export default function AddTaskRow({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const value = title.trim()
    if (value.length < 2) return setOpen(false)
    setBusy(true)
    try {
      await onAdd(value, dueDate || undefined)
      setTitle('')
      setDueDate('')
    } catch { /* the error banner shows the message */ }
    setBusy(false)
  }

  return (
    <div className="rounded-lg bg-[#252628] p-3">
      {open && (
        <div className="rounded-xl border border-white/50 bg-[#252628] px-5 py-4 focus-within:border-white/70">
          <div className="flex items-center gap-3">
            <CircleCheck className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              autoFocus
              disabled={busy}
              value={title}
              maxLength={120}
              placeholder="Write a task name"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); submit() }
                if (e.key === 'Escape') { setOpen(false); setTitle(''); setDueDate('') }
              }}
              className="min-w-0 flex-1 bg-transparent text-[15px] text-slate-100 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="mt-7 flex items-center gap-2 pl-1">
            <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-dashed border-slate-400 text-slate-300 hover:bg-white/5" title="Set due date">
              <CalendarDays className="h-4 w-4" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Task due date"
              />
            </label>
            {dueDate && <span className="text-sm text-green-400">{formatDate(dueDate)}</span>}
          </div>
        </div>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => open ? submit() : setOpen(true)}
        className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
      >
        <Plus className="h-4 w-4" /> {busy ? 'Adding...' : 'Add task'}
      </button>
    </div>
  )
}
