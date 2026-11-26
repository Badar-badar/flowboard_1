import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { NavLink, useNavigate } from 'react-router-dom'
import { PATHS } from '../app/paths'
import AvatarMenu from './avatar-menu'
import { useAuth } from '../features/auth/hooks/use-auth'
import ProjectIcon from '../features/projects/components/project-icon'
import { projectsSelectors } from '../features/projects/store/projects.slice'
import { fetchProjects } from '../features/projects/store/projects.thunks'
import { fetchMyTasks, fetchProjectTasks } from '../features/tasks/store/tasks.thunks'

import {
  Home, CircleCheck, ClipboardList,
  ChevronDown, Plus, X,
} from 'lucide-react'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-2 py-1.5 text-[13px] transition-colors ${
    isActive
      ? 'bg-[#3a3b3d] text-white'
      : 'text-slate-200 hover:bg-white/5'
  }`

function Panel({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const [workOpen, setWorkOpen] = useState(true)
  const dispatch = useAppDispatch()
  const projects = useAppSelector(projectsSelectors.selectAll)
  const activeId = useAppSelector((state) => state.workspace.activeId)
  const projectCache = useAppSelector((state) => state.projects)
  const taskCache = useAppSelector((state) => state.tasks)
  const { user } = useAuth()
  const navigate = useNavigate()
  const accountName = user?.displayName?.trim() || user?.email?.split('@')[0] || 'User'

  const prefetchProjects = () => {
    if (activeId && !(projectCache.loaded && projectCache.workspaceId === activeId) && !(projectCache.loading && projectCache.workspaceId === activeId)) {
      dispatch(fetchProjects(activeId))
    }
  }
  const prefetchMyTasks = () => {
    if (activeId && !taskCache.myLoaded && !taskCache.myRequestId) dispatch(fetchMyTasks())
  }
  const prefetchProjectTasks = (projectId: string) => {
    if (!taskCache.loadedProjects[projectId] && !taskCache.loadingProjects[projectId]) dispatch(fetchProjectTasks(projectId))
  }

  return (
    <div className="flex h-full w-[250px] flex-col">
      <div className="flex h-3 shrink-0 items-center justify-end px-3">
        {mobile && <button type="button" aria-label="Close menu" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>}
      </div>

      <nav className="space-y-0.5 px-2">
        <NavLink to={PATHS.home} end className={linkClass}>
          <Home className="h-5 w-5" /> Home
        </NavLink>
        <hr className="!my-3 border-white/10" />

        <NavLink to={PATHS.tasks} onMouseEnter={prefetchMyTasks} onFocus={prefetchMyTasks} className={linkClass}>
          <CircleCheck className="h-5 w-5" /> My tasks
        </NavLink>
        <NavLink to={PATHS.projects} end onMouseEnter={prefetchProjects} onFocus={prefetchProjects} className={linkClass}>
          <ClipboardList className="h-5 w-5" /> Projects
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
        <NavLink key={p._id} to={PATHS.projectDetail(p._id)} onMouseEnter={() => prefetchProjectTasks(p._id)} onFocus={() => prefetchProjectTasks(p._id)} className={linkClass}>
          <ProjectIcon color={p.color} size="h-6 w-6" />
          <span className="truncate">{p.name}</span>
        </NavLink>
      ))}
      </div>

      <div className="mt-auto flex h-16 shrink-0 items-center gap-3 border-t border-white/10 px-3">
        <AvatarMenu />
        <span className="min-w-0 truncate text-sm font-medium text-slate-200">{accountName}</span>
      </div>
    </div>
  )
}

/* ---------- Export ---------- */
export default function Sidebar({ open, onWorkClick, mobile = false, onClose }: { open: boolean; onWorkClick: () => void; mobile?: boolean; onClose?: () => void }) {
  return (
    <aside className={`relative flex h-full shrink-0 transition-[width] duration-200 ${open ? 'w-[250px]' : 'w-[56px]'}`}>
      {open ? (
        <div className="h-full rounded-tr-2xl border-r border-t border-white/10 bg-[#252628] text-slate-200">
          <Panel mobile={mobile} onClose={onClose} />
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center bg-[#1e1f21] px-2 py-2">
          <div className="mt-auto pb-1"><AvatarMenu /></div>
        </div>
      )}
    </aside>
  )
}
