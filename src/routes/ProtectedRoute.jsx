import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { PATHS } from './paths'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1e1f21] text-slate-400">
        Loading...
      </div>
    )
  }
  return user ? <Outlet /> : <Navigate to={PATHS.login} replace state={{ from: location }} />
}