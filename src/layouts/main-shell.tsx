import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { CircleCheck, Home, FolderKanban } from 'lucide-react'
import Sidebar from './sidebar'
import Topbar from './topbar'

export default function AppLayout() {
  const [panelOpen, setPanelOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setMobileMenuOpen(false), [location.pathname])

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
        <main className="min-w-0 flex-1 overflow-y-auto p-4 pb-20 md:p-5">
          <Outlet />
        </main>
      </div>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-white/10 bg-[#1e1f21] px-2 py-2 md:hidden">
        {[
          { to: '/', label: 'Home', Icon: Home },
          { to: '/tasks', label: 'Tasks', Icon: CircleCheck },
          { to: '/projects', label: 'Projects', Icon: FolderKanban },
        ].map(({ to, label, Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 text-xs ${isActive ? 'text-white' : 'text-slate-400'}`}><Icon className="h-5 w-5" />{label}</NavLink>)}
      </nav>
      {mobileMenuOpen && <div className="fixed inset-0 z-50 md:hidden">
        <button type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-black/60" />
        <div className="relative h-full w-[min(280px,85vw)] shadow-2xl">
          <button type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} className="absolute right-2 top-2 z-10 rounded-md bg-[#303133] px-2 py-1 text-sm text-white">Close</button>
          <Sidebar open onWorkClick={() => setMobileMenuOpen(false)} />
        </div>
      </div>}
    </div>
  )
}
