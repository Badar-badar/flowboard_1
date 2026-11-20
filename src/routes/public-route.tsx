import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/use-auth'
import { PATHS } from '../app/paths'
import RouteLoading from '../layouts/route-loading'

export default function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading) return <RouteLoading />
  return user ? <Navigate to={PATHS.home} replace /> : <Outlet />
}
