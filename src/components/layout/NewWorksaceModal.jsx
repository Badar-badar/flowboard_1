import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useWorkspace } from '../../features/workspace/useWorkspace'

export default function NewWorkspaceModal({ onClose }) {
  const { addWorkspace, creating } = useWorkspace()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (name.trim().length < 2) return setError('Name must be at least 2 characters')
    try {
      await addWorkspace(name.trim())
      onClose()
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Could not create workspace')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#252628] p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">New workspace</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-1 block text-sm text-slate-400">Workspace name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          placeholder="Company or team name"
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-white/40"
        />
        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5">
            Cancel
          </button>
          <button
            disabled={creating}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}