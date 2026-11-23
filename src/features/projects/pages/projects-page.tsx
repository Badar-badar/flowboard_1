import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownUp, ChevronDown, FolderPlus, Search } from 'lucide-react'
import { useProjects } from '../hooks/use-projects'
import ProjectsTable from '../components/projects-table'
import { PATHS } from '../../../app/paths'
import Dropdown from '../../../components/ui/dropdown'
import Avatar from '../../../components/ui/avatar'
import { useWorkspace } from '../../workspace/hooks/use-workspace'
import { useAuth } from '../../auth/hooks/use-auth'

const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
]

function asPerson(value, fallback = null) {
  if (typeof value === 'string') {
    const email = value.includes('@') ? value : ''
    return { id: value, name: email || fallback || 'Unknown user', email }
  }
  if (!value || typeof value !== 'object') return fallback ? asPerson(fallback) : null
  const id = value._id ?? value.uid ?? value.userId ?? value.email
  if (!id) return fallback ? asPerson(fallback) : null
  return {
    id: String(id),
    name: value.name ?? value.displayName ?? value.email ?? fallback ?? (String(id).includes('@') ? String(id) : `Member ${String(id).slice(-4)}`),
    email: value.email ?? (typeof fallback === 'string' && fallback.includes('@') ? fallback : ''),
  }
}

function getOwner(project) {
  return asPerson(project.owner ?? project.createdBy)
}

export default function Projects() {
  const navigate = useNavigate()
  const { projects, loaded, loading, error, refetch } = useProjects()
  const { activeWorkspace } = useWorkspace()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [ownerQuery, setOwnerQuery] = useState('')
  const [memberQuery, setMemberQuery] = useState('')
  const [selectedOwner, setSelectedOwner] = useState(null)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [modifiedDirection, setModifiedDirection] = useState('desc')

  const owners = useMemo(() => {
    const ownerId = typeof activeWorkspace?.ownerId === 'string'
      ? activeWorkspace.ownerId
      : activeWorkspace?.ownerId?._id ?? activeWorkspace?.ownerId?.uid ?? activeWorkspace?.ownerId?.userId
    const workspaceOwner = asPerson(activeWorkspace?.owner) ?? asPerson(
      activeWorkspace?.ownerId,
      activeWorkspace?.ownerEmail,
    )
    if (!workspaceOwner && !ownerId && !activeWorkspace?.ownerEmail) return []

    const id = String(workspaceOwner?.id ?? ownerId ?? activeWorkspace.ownerEmail)
    const isCurrentUser = user && [user.uid, user.email].includes(id)
    return [{
      id,
      name: workspaceOwner?.name === id
        ? activeWorkspace?.ownerName ?? (isCurrentUser ? user.displayName ?? user.email : 'Workspace owner')
        : workspaceOwner?.name ?? activeWorkspace?.ownerName ?? 'Workspace owner',
      email: workspaceOwner?.email || activeWorkspace?.ownerEmail || (isCurrentUser ? user.email ?? '' : ''),
    }]
  }, [activeWorkspace, user])

  const matchingOwners = useMemo(() => {
    const q = ownerQuery.trim().toLowerCase()
    return q ? owners.filter((owner) => `${owner.name} ${owner.email}`.toLowerCase().includes(q)) : owners
  }, [owners, ownerQuery])

  const members = useMemo(() => {
    const uniqueMembers = new Map()
    projects.forEach((project) => {
      const projectPeople = [...(project.members ?? []), getOwner(project)].filter(Boolean)
      projectPeople.forEach((member) => {
        const person = asPerson(member)
        if (person) uniqueMembers.set(person.id, { ...uniqueMembers.get(person.id), ...person })
      })
    })
    if (user) {
      const currentUser = asPerson(user)
      if (currentUser) uniqueMembers.set(currentUser.id, { ...uniqueMembers.get(currentUser.id), ...currentUser })
    }
    return [...uniqueMembers.values()]
  }, [projects, user])

  const matchingMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase()
    return q ? members.filter((member) => `${member.name} ${member.email}`.toLowerCase().includes(q)) : members
  }, [members, memberQuery])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((project) => {
      const matchesQuery = !q || (project.name ?? '').toLowerCase().includes(q)
      const matchesOwner = !selectedOwner
        || (typeof activeWorkspace?.ownerId === 'string' ? activeWorkspace.ownerId : activeWorkspace?.ownerId?._id ?? activeWorkspace?.ownerId?.uid ?? activeWorkspace?.ownerId?.userId) === selectedOwner.id
        || activeWorkspace?.owner?.email?.toLowerCase() === selectedOwner.email?.toLowerCase()
      const projectPeople = [...(project.members ?? []), getOwner(project)].filter(Boolean)
      const projectMemberIds = projectPeople.map((member) => asPerson(member)?.id).filter(Boolean)
      const matchesMembers = selectedMembers.length === 0 || selectedMembers.every((member) => projectMemberIds.includes(member.id))
      const status = (project.status ?? '').toLowerCase().replaceAll('_', ' ')
      const matchesStatus = !selectedStatus || status === selectedStatus.replaceAll('_', ' ')
      return matchesQuery && matchesOwner && matchesMembers && matchesStatus
    }).sort((a, b) => {
      const aDate = new Date(a.updatedAt ?? a.updated_at ?? a.createdAt ?? a.created_at ?? 0).getTime()
      const bDate = new Date(b.updatedAt ?? b.updated_at ?? b.createdAt ?? b.created_at ?? 0).getTime()
      return modifiedDirection === 'desc' ? bDate - aDate : aDate - bDate
    })
  }, [activeWorkspace, projects, query, selectedOwner, selectedMembers, selectedStatus, modifiedDirection])

  return (
    <section className="-mx-4 -mt-4 min-h-full md:-mx-5 md:-mt-5">
      <header className="flex min-h-20 items-center justify-between border-y border-white/10 px-3 py-3 md:px-5">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Projects</h1>
        <button
          onClick={() => navigate(PATHS.newProject)}
          className="rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/5"
        >
          Create project
        </button>
      </header>

      <div className="px-3 pt-2 sm:px-5">
        <label className="relative flex h-11 items-center">
          <Search className="pointer-events-none absolute left-4 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Find a project"
            placeholder="Find a project"
            className="h-md w-full rounded-full border py-1 border-white/15 bg-transparent pl-11 pr-4 text-base text-white outline-none placeholder:text-slate-400 focus:border-white/30"
          />
        </label>

        <div className="flex flex-wrap gap-3 py-3">
          <Dropdown
            width="w-[min(26rem,calc(100vw-2rem))]"
            trigger={({ open, toggle }) => (
              <button
                type="button"
                aria-expanded={open}
                onClick={() => { setOwnerQuery(''); toggle() }}
                className={`inline-flex h-7 items-center gap-2 rounded-full border px-4 text-sm font-medium transition hover:bg-white/5 ${selectedOwner ? 'border-white/30 text-white' : 'border-white/15 text-slate-100'}`}
              >
                {selectedOwner?.email ?? 'Owner'}<ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            )}
          >
            {({ close }) => (
              <div className="p-3">
                <label className="relative flex h-7 items-center rounded-xl border-2 border-white/90">
                  <Search className="pointer-events-none absolute left-4 h-4 w-4 text-slate-400" />
                  <input
                    autoFocus
                    value={ownerQuery}
                    onChange={(event) => setOwnerQuery(event.target.value)}
                    aria-label="Filter projects by owner"
                    placeholder="Filter projects by owner"
                    className="h-md w-md bg-transparent pl-11 pr-4 text-base text-white outline-none placeholder:text-slate-400"
                  />
                </label>
                <div className="-mx-3 mt-3 max-h-64 overflow-y-auto border-t border-white/10 pt-1">
                  {selectedOwner && (
                    <button
                      type="button"
                      onClick={() => { setSelectedOwner(null); close() }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/5"
                    >
                      All owners
                    </button>
                  )}
                  {matchingOwners.map((owner) => (
                    <button
                      key={owner.id}
                      type="button"
                      onClick={() => { setSelectedOwner(owner); close() }}
                      className="flex min-h-14 w-full items-center gap-3 px-1 text-left hover:bg-white/5"
                    >
                      <Avatar name={owner.name} className="ml-1 h-7 w-7" />
                      <span className="min-w-16 text-sm text-slate-200">{owner.email || owner.name}</span>
                      {owner.email && <span className="truncate text-sm text-slate-400">{owner.name}</span>}
                    </button>
                  ))}
                  {matchingOwners.length === 0 && (
                    <p className="px-2 py-4 text-sm text-slate-400">No owners found</p>
                  )}
                </div>
              </div>
            )}
          </Dropdown>
          <Dropdown
            width="w-[min(26rem,calc(100vw-2rem))]"
            trigger={({ open, toggle }) => (
              <button
                type="button"
                aria-expanded={open}
                onClick={() => { setMemberQuery(''); toggle() }}
                className={`inline-flex h-7 items-center gap-2 rounded-full border px-4 text-sm font-medium transition hover:bg-white/5 ${selectedMembers.length ? 'border-white/30 text-white' : 'border-white/15 text-slate-100'}`}
              >
                {selectedMembers.length ? `Members (${selectedMembers.length})` : 'Members'}<ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            )}
          >
            {({ close }) => (
              <div className="p-3">
                <label className="relative flex h-7 items-center rounded-xl border-2 border-white/90">
                  <Search className="pointer-events-none absolute left-4 h-4 w-4 text-slate-400" />
                  <input
                    autoFocus
                    value={memberQuery}
                    onChange={(event) => setMemberQuery(event.target.value)}
                    aria-label="Filter projects by members"
                    placeholder="Filter projects by members"
                    className="h-md w-full bg-transparent pl-11 pr-4 text-base text-white outline-none placeholder:text-slate-400"
                  />
                </label>
                <div className="-mx-3 mt-3 max-h-64 overflow-y-auto border-t border-white/10 pt-1">
                  {selectedMembers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setSelectedMembers([]); close() }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/5"
                    >
                      Clear member filters
                    </button>
                  )}
                  {matchingMembers.map((member) => {
                    const checked = selectedMembers.some((selected) => selected.id === member.id)
                    return (
                      <button
                        key={member.id}
                        type="button"
                        aria-pressed={checked}
                        onClick={() => setSelectedMembers((selected) => checked ? selected.filter((item) => item.id !== member.id) : [...selected, member])}
                        className="flex min-h-14 w-full items-center gap-3 px-1 text-left hover:bg-white/5"
                      >
                        <span aria-hidden="true" className={`ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? 'border-emerald-500 bg-emerald-500 text-[#1f1f1f]' : 'border-white/35'}`}>
                          {checked && <span className="text-xs font-bold">✓</span>}
                        </span>
                        <Avatar name={member.name} className="h-7 w-7" />
                        <span className="text-sm text-slate-200">{member.name}</span>
                        <span className="truncate text-sm text-slate-400">{member.email}</span>
                      </button>
                    )
                  })}
                  {matchingMembers.length === 0 && (
                    <p className="px-2 py-4 text-sm text-slate-400">No members found</p>
                  )}
                </div>
              </div>
            )}
          </Dropdown>
          <Dropdown
            width="w-44"
            trigger={({ open, toggle }) => (
              <button
                type="button"
                aria-expanded={open}
                onClick={toggle}
                className={`inline-flex h-7 items-center gap-2 rounded-full border px-4 text-sm font-medium transition hover:bg-white/5 ${selectedStatus ? 'border-white/30 text-white' : 'border-white/15 text-slate-100'}`}
              >
                {statuses.find((status) => status.value === selectedStatus)?.label ?? 'Status'}<ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            )}
          >
            {({ close }) => (
              <div className="py-2">
                {statuses.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selectedStatus === value}
                    onClick={() => { setSelectedStatus((current) => current === value ? null : value); close() }}
                    className="flex h-[46px] w-full items-center px-6 text-left text-lg text-slate-200 transition hover:bg-white/5"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </Dropdown>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_160px_minmax(100px,1fr)_auto] items-center gap-4 border-b border-white/10 px-3 py-2 text-sm text-slate-400 max-sm:grid-cols-[minmax(0,1fr)_100px_auto] sm:px-5">
        <span>Name</span>
        <span className="max-sm:hidden">Members</span>
        <button type="button" onClick={() => setModifiedDirection((direction) => direction === 'desc' ? 'asc' : 'desc')} aria-label={`Sort by last modified ${modifiedDirection === 'desc' ? 'oldest first' : 'newest first'}`} className="flex items-center justify-end gap-1 font-medium hover:text-white"><ArrowDownUp className="h-4 w-4" /> Last modified</button>
        <span aria-hidden="true" />
      </div>

      {!loaded && loading && <p className="px-5 py-8 text-sm text-slate-400">Loading projects...</p>}

      {error && (
        <p className="px-5 py-6 text-sm text-rose-400">
          {error} <button onClick={refetch} className="underline">Retry</button>
        </p>
      )}

      {loaded && !error && projects.length === 0 && (
        <div className="flex flex-col items-center py-18 text-center">
          <FolderPlus className="mb-3 h-6 w-10 text-slate-500" />
          <p className="text-slate-300">No projects in this workspace yet</p>
          <button onClick={() => navigate(PATHS.newProject)} className="mt-4 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/5">
            Create your first project
          </button>
        </div>
      )}

      {loaded && projects.length > 0 && filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-400">No projects match “{query}”</p>
      )}

      {filtered.length > 0 && <ProjectsTable projects={filtered} />}
    </section>
  )
}
