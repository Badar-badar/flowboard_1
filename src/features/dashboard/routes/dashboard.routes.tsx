import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { withSuspense } from '../../../layouts/route-loading'
import { PATHS } from '../../../app/paths'

const DashboardPage = lazy(() => import('../pages/dashboard-page'))
export const dashboardRoutes: RouteObject[] = [{ path: PATHS.home, element: withSuspense(DashboardPage) }]
