import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import { useAuth } from '../../auth/hooks/use-auth'
import { useWorkspace } from '../hooks/use-workspace'
import { getDefaultWorkspaceName } from '../workspace-name'
import { PATHS } from '../../../app/paths'

export default function Onboarding() {
  const { user } = useAuth()
  const { workspaces, loaded, addWorkspace, creating } = useWorkspace()
  const [name, setName] = useState(() => getDefaultWorkspaceName(user))
  const [error, setError] = useState('')

  // already has a workspace (or just created one): go to the app
  if (loaded && workspaces.length > 0) {
    return <Navigate to={PATHS.home} replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const value = name.trim()
    if (value.length < 2) return setError('Name must be at least 2 characters')
    try {
      await addWorkspace(value)
      // the guard sees the new workspace and redirects to Home by itself
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Could not create workspace')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1e1f21] px-4">
      <div className="mb-10 flex items-center gap-2 text-white">
        <LayoutGrid className="h-8 w-8 text-rose-400" />
        <span className="text-2xl font-semibold">Flowboard</span>
      </div>

      <form onSubmit={onSubmit} className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-semibold text-white">Create your workspace</h1>
        <p className="mb-8 text-slate-400">
          A workspace is where your team's projects and tasks live. You can rename it later.
        </p>

        <label className="mb-2 block text-sm text-slate-300">Workspace name</label>
        <input
          autoFocus
          onFocus={(e) => e.target.select()}
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          maxLength={120}
          className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white outline-none focus:border-rose-400"
        />
        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

        <button
          disabled={creating || name.trim().length < 2}
          className="mt-6 w-full rounded-lg bg-rose-500 py-3 font-medium text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Continue'}
        </button>
      </form>
    </div>
  )
}