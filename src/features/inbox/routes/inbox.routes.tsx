import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { withSuspense } from '../../../layouts/route-loading'
import { PATHS } from '../../../app/paths'

const InboxPage = lazy(() => import('../pages/inbox-page'))
export const inboxRoutes: RouteObject[] = [{ path: PATHS.inbox, element: withSuspense(InboxPage) }]
