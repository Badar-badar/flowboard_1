import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAppDispatch } from '../app/hooks'
import { useAuth } from '../features/auth/hooks/use-auth'
import { useWorkspace } from '../features/workspace/hooks/use-workspace'
import { fetchWorkspaces } from '../features/workspace/store/workspace.thunks'
import { PATHS } from '../app/paths'

export default function WorkspaceGate() {
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const { loaded, loading, workspaces, error } = useWorkspace()

  useEffect(() => {
    if (user && !loaded) dispatch(fetchWorkspaces())
  }, [user, loaded, dispatch])

  if (error && !loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-300">
        <p>We couldn't load your workspaces. Please try again.</p>
        <button type="button" onClick={() => dispatch(fetchWorkspaces())} className="rounded-md bg-white/10 px-4 py-2 hover:bg-white/15">Retry</button>
      </div>
    )
  }

  if (!loaded || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1e1f21] text-slate-400">
        Loading...
      </div>
    )
  }

  if (workspaces.length === 0) {
    return <Navigate to={PATHS.onboarding} replace />
  }

  return <Outlet />
}
