import { useEffect, useState } from 'react'
import { ArrowDownUp, CalendarDays, ChevronDown, ChevronRight, CircleCheck, Plus, UserRound } from 'lucide-react'
import { formatDate } from '../task-constants'
import { ROW_GRID } from './task-row'

export default function AddTaskRow({ onAdd, compact = false, autoOpen = false, onClose }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (autoOpen) setOpen(true)
  }, [autoOpen])

  const submit = async () => {
    const value = title.trim()
    if (value.length < 2) return
    setBusy(true)
    try {
      await onAdd(value, dueDate || undefined)
      setTitle('')
      setDueDate('')
      setOpen(false)
      onClose?.()
    } catch { /* the task list shows the error */ }
    setBusy(false)
  }

  const cancel = () => {
    setOpen(false)
    setTitle('')
    setDueDate('')
    onClose?.()
  }

  return (
    <div className={compact ? 'relative' : 'border-b border-white/10'}>
      {open && (compact ? (
        <div className="absolute left-0 top-12 z-30 w-[min(30rem,85vw)] rounded-lg border border-white/20 bg-[#232323] px-4 py-3 shadow-2xl">
          <input
            autoFocus
            disabled={busy}
            value={title}
            maxLength={120}
            placeholder="Write a task name"
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') { event.preventDefault(); submit() }
              if (event.key === 'Escape') cancel()
            }}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
          />
          <div className="mt-3 flex items-center justify-between">
            <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-dashed border-slate-500 text-slate-400 hover:bg-white/5" title="Set due date">
              <CalendarDays className="h-4 w-4" />
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} onClick={(event) => event.currentTarget.showPicker?.()} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Task due date" />
            </label>
            <button type="button" onClick={submit} disabled={busy || title.trim().length < 2} className="rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-400 disabled:opacity-50">{busy ? 'Adding…' : 'Add task'}</button>
          </div>
        </div>
      ) : (
        <div className={`${ROW_GRID} min-h-11 border-y border-blue-500/70 bg-[#08285f]`}>
          <div className="flex min-w-0 items-center gap-3 bg-[#222222] py-1.5 pl-8 pr-3">
            <button type="button" onClick={submit} disabled={busy || title.trim().length < 2} aria-label="Create task" className="shrink-0 text-slate-400 transition hover:text-white disabled:cursor-default">
              <CircleCheck className="h-5 w-5" />
            </button>
            <input
              autoFocus
              disabled={busy}
              value={title}
              maxLength={120}
              placeholder="Write a task name"
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') { event.preventDefault(); submit() }
                if (event.key === 'Escape') cancel()
              }}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400"
            />
            <ArrowDownUp className="h-4 w-4 shrink-0 text-slate-400" />
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </div>
          <div className="flex items-center border-l border-white/10 px-2 max-sm:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-400/70 text-slate-300"><UserRound className="h-4 w-4" /></span>
          </div>
          <div className="relative flex items-center border-l border-white/10 px-2 max-sm:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-400/70 text-slate-300"><CalendarDays className="h-4 w-4" /></span>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} onClick={(event) => event.currentTarget.showPicker?.()} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Task due date" />
            {dueDate && <span className="ml-2 text-xs text-slate-200">{formatDate(dueDate)}</span>}
          </div>
          <div className="border-l border-white/10 max-sm:hidden" />
          <div className="max-sm:hidden" />
        </div>
      ))}

      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((value) => {
          const next = !value
          if (!next) onClose?.()
          return next
        })}
        className={compact
          ? 'inline-flex h-8 items-center gap-2 rounded-md border border-white/15 px-3 text-sm font-medium text-slate-100 transition hover:bg-white/5'
          : 'flex min-h-16 w-full items-center gap-3 pl-16 pr-4 text-left text-[15px] text-slate-400 transition hover:bg-white/[0.045] hover:text-slate-100'}
      >
        {compact && <Plus className="h-4 w-4" />}{busy ? 'Adding…' : 'Add task'}
        {compact && <span aria-hidden="true" className="ml-1 flex h-full items-center border-l border-white/15 pl-2"><ChevronDown className="h-4 w-4 text-slate-400" /></span>}
      </button>
    </div>
  )
}
