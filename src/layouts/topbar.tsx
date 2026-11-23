import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, Plus } from 'lucide-react'
import { useProjects } from '../features/projects/hooks/use-projects'
import { useMyTasks } from '../features/tasks/hooks/use-tasks'
import { useAppSelector } from '../app/hooks'
import { tasksSelectors } from '../features/tasks/store/tasks.slice'
import { PATHS } from '../app/paths'

export default function Topbar({ onMenuClick }) {
  const searchRef = useRef(null)
  const navigate = useNavigate()
  const { projects } = useProjects({ autoFetch: true })
  useMyTasks()
  const tasks = useAppSelector(tasksSelectors.selectAll)
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const matchingProjects = projects.filter((project) => (project.name ?? '').toLowerCase().includes(q)).slice(0, 5)
    const matchingTasks = tasks.filter((task) => {
      const projectName = projects.find((project) => project._id === task.projectId)?.name ?? ''
      return `${task.title ?? ''} ${projectName}`.toLowerCase().includes(q)
    }).slice(0, 5)
    return [
      ...matchingProjects.map((project) => ({ id: project._id, title: project.name, subtitle: 'Project', to: PATHS.projectDetail(project._id) })),
      ...matchingTasks.map((task) => ({ id: task._id, title: task.title, subtitle: projects.find((project) => project._id === task.projectId)?.name ?? 'Task', to: `${PATHS.projectDetail(task.projectId)}?task=${encodeURIComponent(task._id)}` })),
    ].slice(0, 8)
  }, [projects, tasks, query])

  // Ctrl/Cmd + K focuses the search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="z-10 flex h-[49px] shrink-0 items-center gap-2 border-b border-white/10 bg-[#252525] px-2.5 text-slate-200 sm:gap-3 sm:px-5">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        aria-label="Toggle sidebar"
        className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Create pill */}
      <button type="button" onClick={() => navigate(PATHS.newProject)} className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pl-1.5 pr-2.5 text-sm font-medium text-white transition hover:bg-white/10 sm:pr-4">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f65353]">
          <Plus className="h-3 w-3" strokeWidth={2} />
        </span>
        Create
      </button>

      {/* Search */}
      <div className="relative mx-auto w-full min-w-0 max-w-[550px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          aria-label="Search projects and tasks"
          className="w-full rounded-full border border-white/15 bg-white/5 py-1.5 pl-9 pr-3 text-sm text-white placeholder-slate-400 outline-none transition focus:border-white/30 focus:bg-white/10 sm:pr-24"
        />
        <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 gap-1 sm:flex">
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-slate-400">Ctrl</kbd>
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-slate-400">K</kbd>
        </div>
        {query.trim() && <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#2a2b2d] py-1 shadow-2xl">
          {results.length ? results.map((result) => <button key={`${result.subtitle}-${result.id}`} type="button" onClick={() => { navigate(result.to); setQuery('') }} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-white/5">
            <span className="truncate text-sm text-slate-100">{result.title}</span><span className="shrink-0 text-xs text-slate-500">{result.subtitle}</span>
          </button>) : <p className="px-4 py-3 text-sm text-slate-400">No matching projects or tasks</p>}
        </div>}
      </div>

    </header>
  )
}
