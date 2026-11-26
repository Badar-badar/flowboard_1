import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { CircleCheck, Home, FolderKanban } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { fetchProjects } from '../features/projects/store/projects.thunks'
import { fetchMyTasks } from '../features/tasks/store/tasks.thunks'
import Sidebar from './sidebar'
import Topbar from './topbar'

export default function AppLayout() {
  const [panelOpen, setPanelOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dispatch = useAppDispatch()
  const activeId = useAppSelector((state) => state.workspace.activeId)
  const projectCache = useAppSelector((state) => state.projects)
  const taskCache = useAppSelector((state) => state.tasks)
  const location = useLocation()

  useEffect(() => setMobileMenuOpen(false), [location.pathname])

  const prefetch = (to: string) => {
    if (to === '/tasks' && activeId && !taskCache.myLoaded && !taskCache.myRequestId) dispatch(fetchMyTasks())
    if (to === '/projects' && activeId && !(projectCache.loaded && projectCache.workspaceId === activeId) && !(projectCache.loading && projectCache.workspaceId === activeId)) dispatch(fetchProjects(activeId))
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <Topbar onMenuClick={() => {
        if (window.matchMedia('(min-width: 768px)').matches) setPanelOpen((v) => !v)
        else setMobileMenuOpen((v) => !v)
      }} />
      <div className="flex min-h-0 flex-1">
        <div className="hidden md:flex"><Sidebar
          open={panelOpen}
          onWorkClick={() => setPanelOpen((isOpen) => !isOpen)}
        /></div>
        <main className="home-scroll flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-white/10 bg-[#1e1f21] px-2 py-2 md:hidden">
        {[
          { to: '/', label: 'Home', Icon: Home },
          { to: '/tasks', label: 'Tasks', Icon: CircleCheck },
          { to: '/projects', label: 'Projects', Icon: FolderKanban },
        ].map(({ to, label, Icon }) => <NavLink key={to} to={to} onPointerDown={() => prefetch(to)} onFocus={() => prefetch(to)} className={({ isActive }) => `flex flex-col items-center gap-1 text-xs ${isActive ? 'text-white' : 'text-slate-400'}`}><Icon className="h-5 w-5" />{label}</NavLink>)}
      </nav>
      {mobileMenuOpen && <div className="fixed inset-0 z-50 md:hidden">
        <button type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-black/60" />
        <div className="relative h-full w-[min(280px,85vw)] shadow-2xl">
          <Sidebar mobile open onClose={() => setMobileMenuOpen(false)} onWorkClick={() => setMobileMenuOpen(false)} />
        </div>
      </div>}
    </div>
  )
}
