import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { withSuspense } from '../../../layouts/route-loading'
import { PATHS } from '../../../app/paths'

const ProjectsPage = lazy(() => import('../pages/projects-page'))
const NewProjectPage = lazy(() => import('../pages/new-project-page'))
const ProjectDetailPage = lazy(() => import('../pages/project-detail-page'))

export const projectsRoutes: RouteObject[] = [
  { path: PATHS.projects, element: withSuspense(ProjectsPage) },
  { path: PATHS.newProject, element: withSuspense(NewProjectPage) },
  { path: PATHS.projectDetail(':id'), element: withSuspense(ProjectDetailPage) },
]
