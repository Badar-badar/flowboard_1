import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './sidebar'
import Topbar from './topbar'

export default function AppLayout() {
  const [panelOpen, setPanelOpen] = useState(true)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#1f1f1f] text-slate-200">
      <Topbar onMenuClick={() => setPanelOpen((v) => !v)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          open={panelOpen}
          onWorkClick={() => setPanelOpen((isOpen) => !isOpen)}
        />
        <main className="min-w-0 flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
