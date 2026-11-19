import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useAuth } from '../features/auth/useAuth'
import { useWorkspace } from '../features/workspace/useWorkspace'
import { fetchWorkspaces } from '../features/workspace/workspaceThunks'
import { PATHS } from './paths'

export default function WorkspaceGate() {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const { loaded, workspaces } = useWorkspace()

  useEffect(() => {
    if (user && !loaded) dispatch(fetchWorkspaces())
  }, [user, loaded, dispatch])

  if (!loaded) {
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