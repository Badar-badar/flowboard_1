import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { PATHS } from '../../routes/paths'
import AvatarMenu from './AvatarMenu'
import { useProjects } from '../../features/projects/useProjects'
import ProjectIcon from '../projects/ProjectIcon'

import {
  LayoutGrid, Bot, Triangle, Map, User, Ellipsis,
  Home, Bell, CircleCheck, ClipboardList, Folder,
  ChevronDown, Plus, CircleHelp, UserPlus, ListTree,
} from 'lucide-react'

const railItems = [
  { label: 'Work', icon: LayoutGrid, active: true },
  { label: 'Agents', icon: Bot },
  { label: 'Strategy', icon: Triangle },
  { label: 'Knowledge', icon: Map },
  { label: 'People', icon: User },
]

function RailButton({ label, icon: Icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="group flex w-full flex-col items-center gap-1 py-1"
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
          active ? 'bg-[#3a3b3d] text-white' : 'text-slate-400 group-hover:bg-white/10'
        }`}
      >
        <Icon className="h-5 w-5" fill={active ? 'currentColor' : 'none'} />
      </span>
      <span className={`text-xs ${active ? 'text-white' : 'text-slate-400'}`}>
        {label}
      </span>
    </button>
  )
}

function Rail({ panelOpen, onWorkClick }) {
  return (
    <div className="flex w-[59px] shrink-0 flex-col items-center bg-[#1e1f21] py-1">
      <div className="w-full space-y-0.5 px-2">
        {railItems.map((item) => (
          <RailButton
            key={item.label}
            {...item}
            active={item.label === 'Work' ? panelOpen : item.active}
            onClick={item.label === 'Work' ? onWorkClick : undefined}
          />
        ))}
        <button className="group flex w-full flex-col items-center gap-1 py-1">
          <span className="flex h-10 w-12 items-center justify-center text-slate-400">
            <Ellipsis className="h-6 w-6" />
          </span>
          <span className="text-xs text-slate-400">More</span>
        </button>
      </div>

      <div className="mt-auto flex flex-col items-center gap-3 pb-2">
        <button className="text-slate-400 hover:text-white">
          <CircleHelp className="h-5 w-5" />
        </button>
       <AvatarMenu />
      </div>
    </div>
  )
}

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-2 py-1.5 text-[13px] transition-colors ${
    isActive
      ? 'bg-[#3a3b3d] text-white'
      : 'text-slate-200 hover:bg-white/5'
  }`

function Panel() {
  const [workOpen, setWorkOpen] = useState(true)
  const { projects } = useProjects({ autoFetch: true })
  const navigate = useNavigate()

  return (
    <div className="flex h-full w-[190px] flex-col">
      <h2 className="px-3 pb-3 pt-2.5 text-sm font-small text-slate-400">Work</h2>

      <nav className="space-y-0.5 px-2">
        <NavLink to={PATHS.home} end className={linkClass}>
          <Home className="h-5 w-5" /> Home
        </NavLink>
        <NavLink to={PATHS.inbox} className={linkClass}>
          <Bell className="h-5 w-5" /> Inbox
        </NavLink>

        <hr className="!my-3 border-white/10" />

        <NavLink to={PATHS.tasks} className={linkClass}>
          <CircleCheck className="h-5 w-5" /> My tasks
        </NavLink>
        <NavLink to={PATHS.projects} end className={linkClass}>
          <ClipboardList className="h-5 w-5" /> Projects
        </NavLink>
        <NavLink to={PATHS.portfolios} className={linkClass}>
          <Folder className="h-5 w-5" /> Portfolios
        </NavLink>
      </nav>

      {/* Collapsible Work section */}
      <div className="mt-1 flex-1 overflow-y-1 px-2">
        <div className="flex items-center justify-between px-3 py-1">
          <button
            onClick={() => setWorkOpen((v) => !v)}
            className="flex items-center gap-2 text-[15px] font-medium text-slate-300 hover:text-white"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${workOpen ? '' : '-rotate-90'}`}
              fill="currentColor"
            />
            Work
          </button>
         <button onClick={() => navigate(PATHS.newProject)} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white">
          <Plus className="h-5 w-5" />
        </button>
        </div>

        {workOpen && projects.map((p) => (
        <NavLink key={p._id} to={PATHS.projectDetail(p._id)} className={linkClass}>
          <ProjectIcon color={p.color} size="h-6 w-6" />
          <span className="truncate">{p.name}</span>
        </NavLink>
      ))}
      </div>

      {/* Bottom: trial card + invite */}
      <div className="space-y-1 p-1">
        <div className="rounded-xl border border-white/10 p-1.5">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 36 36" className="h-8 w-8 shrink-0">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#2f9e58" strokeWidth="5" />
            </svg>
            <div>
              <p className="text-sm font-medium text-white">Advanced trial</p>
              <p className="text-sm text-emerald-400">14 days left</p>
            </div>
          </div>
          <button className="mt-3 w-full rounded-lg bg-[#ecc200] py-1.5 text-sm font-medium text-black hover:bg-[#f5cf1a]">
            Add billing info
          </button>
        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-1.5 text-sm text-slate-200 hover:bg-white/5">
          <UserPlus className="h-5 w-5" /> Invite
        </button>
      </div>
    </div>
  )
}

/* ---------- Export ---------- */
export default function Sidebar({ open, onWorkClick }) {
  return (
    <aside className="flex h-full shrink-0 bg-[#1e1f21] text-slate-200">
      <Rail panelOpen={open} onWorkClick={onWorkClick} />
      {/* Outer wrapper animates width; inner panel keeps fixed width so text doesn't reflow */}
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? 'w-[190px]' : 'w-0'
        }`}
      >
        <div className="h-full rounded-tl-2xl border-l border-t border-white/10 bg-[#252628]">
          <Panel />
        </div>
      </div>
    </aside>
  )
}
