import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { withSuspense } from '../../../layouts/route-loading'
import { PATHS } from '../../../app/paths'

const MyTasksPage = lazy(() => import('../pages/my-tasks-page'))

export const tasksRoutes: RouteObject[] = [
  { path: PATHS.tasks, element: withSuspense(MyTasksPage) },
]
