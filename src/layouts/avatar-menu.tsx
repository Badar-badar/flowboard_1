import { useEffect, useRef, useState } from 'react'
import { Check, LogOut, Plus } from 'lucide-react'
import { useAuth } from '../features/auth/hooks/use-auth'
import { useWorkspace } from '../features/workspace/hooks/use-workspace'
import NewWorkspaceModal from './new-workspace-modal'

const initials = (text = '') => {
  const parts = text.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase()
}

export default function AvatarMenu() {
  const { user, logout } = useAuth()
  const { workspaces, activeId, switchTo } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const name = user?.displayName || user?.email || 'User'

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-200 text-sm font-medium text-slate-800 hover:ring-2 hover:ring-white/30"
        >
          {initials(name)}
        </button>

        {open && (
          <div className="absolute bottom-0 left-full z-50 ml-3 flex w-[560px] overflow-hidden rounded-xl border border-white/10 bg-[#2a2b2d] shadow-2xl">
            {/* Left: workspaces */}
            <div className="w-[260px] border-r border-white/10 p-3">
              <h3 className="px-2 pb-2 pt-1 text-lg font-semibold text-white">Account</h3>
              <ul className="max-h-72 space-y-0.5 overflow-y-auto">
                {workspaces.map((w) => (
                  <li key={w._id}>
                    <button
                      onClick={() => { switchTo(w._id); setOpen(false) }}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-200 text-xs font-medium text-slate-800">
                        {initials(w.name)}
                      </span>
                      <span className="flex-1 truncate text-[15px] text-slate-100">{w.name}</span>
                      {w._id === activeId && <Check className="h-4 w-4 text-slate-300" />}
                    </button>
                  </li>
                ))}
                {!workspaces.length && (
                  <li className="px-2 py-2 text-sm text-slate-400">No workspaces yet</li>
                )}
              </ul>
            </div>

            {/* Right: profile */}
            <div className="flex-1 p-4">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rose-200 text-lg font-medium text-slate-800">
                  {initials(name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-white">{name}</p>
                  <p className="truncate text-sm text-slate-400">{user?.email}</p>
                </div>
              </div>

              <hr className="my-3 border-white/10" />

              <button
                onClick={() => { setOpen(false); setModalOpen(true) }}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-[15px] text-slate-100 hover:bg-white/5"
              >
                <Plus className="h-5 w-5" /> New workspace
              </button>
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-[15px] text-slate-100 hover:bg-white/5"
              >
                <LogOut className="h-5 w-5" /> Log out
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && <NewWorkspaceModal onClose={() => setModalOpen(false)} />}
    </>
  )
}