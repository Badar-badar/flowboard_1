import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { PATHS } from './paths'

export default function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to={PATHS.home} replace /> : <Outlet />
}