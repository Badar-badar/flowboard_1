import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Bell, CircleCheck, Home, FolderKanban } from 'lucide-react'
import Sidebar from './sidebar'
import Topbar from './topbar'

export default function AppLayout() {
  const [panelOpen, setPanelOpen] = useState(true)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <Topbar onMenuClick={() => setPanelOpen((v) => !v)} />
      <div className="flex min-h-0 flex-1">
        <div className="hidden md:flex"><Sidebar
          open={panelOpen}
          onWorkClick={() => setPanelOpen((isOpen) => !isOpen)}
        /></div>
        <main className="min-w-0 flex-1 overflow-y-auto p-4 pb-20 md:p-5">
          <Outlet />
        </main>
      </div>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-[#1e1f21] px-2 py-2 md:hidden">
        {[
          { to: '/', label: 'Home', Icon: Home },
          { to: '/inbox', label: 'Inbox', Icon: Bell },
          { to: '/tasks', label: 'Tasks', Icon: CircleCheck },
          { to: '/projects', label: 'Projects', Icon: FolderKanban },
        ].map(({ to, label, Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 text-xs ${isActive ? 'text-white' : 'text-slate-400'}`}><Icon className="h-5 w-5" />{label}</NavLink>)}
      </nav>
    </div>
  )
}
