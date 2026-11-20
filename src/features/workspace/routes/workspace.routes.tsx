import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { withSuspense } from '../../../layouts/route-loading'
import { PATHS } from '../../../app/paths'

const OnboardingPage = lazy(() => import('../pages/onboarding-page'))

export const workspaceRoutes: RouteObject[] = [
  { path: PATHS.onboarding, element: withSuspense(OnboardingPage) },
]
