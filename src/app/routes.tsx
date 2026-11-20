import { lazy } from 'react'
import { useRoutes } from 'react-router-dom'
import MainShell from '../layouts/main-shell'
import { withSuspense } from '../layouts/route-loading'
import ProtectedRoute from '../routes/protected-route'
import PublicRoute from '../routes/public-route'
import WorkspaceGate from '../routes/workspace-gate'
import { authRoutes } from '../features/auth/routes/auth.routes'
import { workspaceRoutes } from '../features/workspace/routes/workspace.routes'
import { projectsRoutes } from '../features/projects/routes/projects.routes'
import { tasksRoutes } from '../features/tasks/routes/tasks.routes'
import { dashboardRoutes } from '../features/dashboard/routes/dashboard.routes'
import { inboxRoutes } from '../features/inbox/routes/inbox.routes'
import { PATHS } from './paths'

const NotFoundPage = lazy(() => import('./not-found-page'))

export default function AppRoutes() {
  return useRoutes([
    { element: <PublicRoute />, children: authRoutes },
    {
      element: <ProtectedRoute />,
      children: [
        ...workspaceRoutes,
        {
          element: <WorkspaceGate />,
          children: [
            {
              element: <MainShell />,
              children: [
                ...dashboardRoutes,
                ...inboxRoutes,
                ...tasksRoutes,
                ...projectsRoutes,
                { path: PATHS.portfolios, element: withSuspense(NotFoundPage) },
                { path: '*', element: withSuspense(NotFoundPage) },
              ],
            },
          ],
        },
      ],
    },
  ])
}
