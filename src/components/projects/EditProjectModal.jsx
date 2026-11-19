import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { PROJECT_STATUSES } from '../../lib/projectConstants'
import { useProjects } from '../../features/projects/useProjects'

const field = 'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-white/40 [color-scheme:dark]'
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '')

export default function EditProjectModal({ project, onClose }) {
  const { editProject } = useProjects()
  const [form, setForm] = useState({
    name: project.name,
    description: project.description ?? '',
    status: project.status,
    startDate: day(project.startDate),
    dueDate: day(project.endDate),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    if (name.length < 2) return setError('Name must be at least 2 characters')

    const changes = { name, status: form.status, description: form.description.trim() }
    if (form.startDate) changes.startDate = form.startDate
    if (form.dueDate) changes.dueDate = form.dueDate

    setSaving(true)
    try {
      await editProject(project._id, changes)
      onClose()
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Could not save changes')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form onSubmit={onSubmit} className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#252628] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Edit project settings</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <label className="mb-1 block text-sm text-slate-400">Project name</label>
        <input autoFocus value={form.name} onChange={set('name')} maxLength={150} className={field} />

        <label className="mb-1 mt-4 block text-sm text-slate-400">Description</label>
        <textarea value={form.description} onChange={set('description')} rows={3} maxLength={2000} className={field} />

        <label className="mb-1 mt-4 block text-sm text-slate-400">Status</label>
        <select value={form.status} onChange={set('status')} className={field}>
          {PROJECT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Start date</label>
            <input type="date" value={form.startDate} onChange={set('startDate')} className={field} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Due date</label>
            <input type="date" value={form.dueDate} min={form.startDate || undefined} onChange={set('dueDate')} className={field} />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Cancel</button>
          <button disabled={saving} className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-60">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}