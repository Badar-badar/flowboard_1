import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FolderPlus, Plus } from 'lucide-react'
import { useProjects } from '../features/projects/useProjects'
import ProjectsTable from '../components/projects/ProjectsTable'
import { PATHS } from '../routes/paths'

export default function Projects() {
  const navigate = useNavigate()
  const { projects, loaded, loading, error, refetch } = useProjects()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? projects.filter((p) => (p.name ?? '').toLowerCase().includes(q)) : projects
  }, [projects, query])

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 px-2">
        <h1 className="text-lg font-semibold text-white">Projects</h1>
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-slate-300">{projects.length}</span>
        <button
          onClick={() => navigate(PATHS.newProject)}
          aria-label="Create project"
          title="Create project"
          className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <Plus className="h-5 w-5" />
        </button>
        <label className="relative ml-auto flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-white/10 focus-within:w-64">
          <Search className="pointer-events-none absolute left-2 h-4 w-4" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Find a project"
            placeholder="Find a project"
            className="h-8 w-full rounded border border-transparent bg-transparent pl-8 pr-2 text-sm text-white outline-none placeholder:text-transparent focus:border-white/15 focus:bg-white/5 focus:placeholder:text-slate-500"
          />
        </label>
      </div>

      {!loaded && loading && <p className="text-slate-400">Loading projects...</p>}

      {error && (
        <p className="text-rose-400">
          {error} <button onClick={refetch} className="underline">Retry</button>
        </p>
      )}

      {loaded && !error && projects.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <FolderPlus className="mb-3 h-10 w-10 text-slate-500" />
          <p className="text-slate-300">No projects in this workspace yet</p>
          <button onClick={() => navigate(PATHS.newProject)} className="mt-4 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600">
            Create your first project
          </button>
        </div>
      )}

      {loaded && projects.length > 0 && filtered.length === 0 && (
        <p className="py-10 text-center text-slate-400">No projects match "{query}"</p>
      )}

      {filtered.length > 0 && <ProjectsTable projects={filtered} />}
    </div>
  )
}
