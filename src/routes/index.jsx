import { useRoutes } from 'react-router-dom'
import AppLayout from '../components/layout/app-layout'
import Home from '../pages/home'
import Inbox from '../pages/index'
import Tasks from '../pages/MyTasks'
import Projects from '../pages/Projects'
import NewProject from '../pages/NewProject'
import ProjectDetail from '../pages/ProjectDetail'
import NotFound from '../pages/not-found'
import Onboarding from '../pages/Onboarding'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'
import WorkspaceGate from './WorkspaceGate'
import { PATHS } from './paths'

export default function AppRoutes() {
  return useRoutes([
    {
      element: <PublicRoute />,
      children: [
        { path: PATHS.login, element: <Login /> },
        { path: PATHS.signup, element: <Signup /> },
      ],
    },
    {
      element: <ProtectedRoute />,
      children: [
        { path: PATHS.onboarding, element: <Onboarding /> },
        {
          element: <WorkspaceGate />,
          children: [
            {
              element: <AppLayout />,
              children: [
                { path: PATHS.home, element: <Home /> },
                { path: PATHS.inbox, element: <Inbox /> },
                { path: PATHS.tasks, element: <Tasks /> },
                { path: PATHS.projects, element: <Projects /> },
                { path: PATHS.newProject, element: <NewProject /> },
                { path: PATHS.projectDetail(':id'), element: <ProjectDetail /> },
                { path: PATHS.portfolios, element: <NotFound /> },
                { path: '*', element: <NotFound /> },
              ],
            },
          ],
        },
      ],
    },
  ])
}
