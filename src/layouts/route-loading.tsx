import { Suspense } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'

export default function RouteLoading() {
  return <div className="flex min-h-64 items-center justify-center text-slate-400" role="status">Loading…</div>
}

export const withSuspense = (Page: LazyExoticComponent<ComponentType>) => (
  <Suspense fallback={<RouteLoading />}><Page /></Suspense>
)
