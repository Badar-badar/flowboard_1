import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { withSuspense } from '../../../layouts/route-loading'
import { PATHS } from '../../../app/paths'

const LoginPage = lazy(() => import('../pages/login-page'))
const SignupPage = lazy(() => import('../pages/signup-page'))
export const authRoutes: RouteObject[] = [
  { path: PATHS.login, element: withSuspense(LoginPage) },
  { path: PATHS.signup, element: withSuspense(SignupPage) },
]
