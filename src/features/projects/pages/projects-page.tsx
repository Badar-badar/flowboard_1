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

const statuses = ['Active', 'Closed', 'Archived']

function getOwner(project) {
  const owner = project.owner ?? project.createdBy
  if (!owner || typeof owner !== 'object') return null
  const id = owner._id ?? owner.uid ?? owner.userId ?? owner.email
  if (!id) return null
  return { id: String(id), name: owner.name ?? owner.displayName ?? owner.email ?? 'Unknown owner', email: owner.email ?? '' }
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

  const owners = useMemo(() => {
    const workspaceOwner = activeWorkspace?.owner
    const ownerId = typeof activeWorkspace?.ownerId === 'string'
      ? activeWorkspace.ownerId
      : activeWorkspace?.ownerId?._id ?? activeWorkspace?.ownerId?.uid ?? activeWorkspace?.ownerId?.userId
    const isCurrentUserOwner = ownerId && [user?.uid, user?.email].includes(ownerId)
    const owner = workspaceOwner ?? (typeof activeWorkspace?.ownerId === 'object' ? activeWorkspace.ownerId : null)

    if (owner) {
      const id = owner._id ?? owner.uid ?? owner.userId ?? owner.email
      if (id) return [{ id: String(id), name: owner.name ?? owner.displayName ?? owner.email ?? 'Workspace owner', email: owner.email ?? '' }]
    }

    if (isCurrentUserOwner && user) {
      return [{ id: user.uid, name: user.displayName ?? user.email ?? 'Workspace owner', email: user.email ?? '' }]
    }

    if (activeWorkspace?.ownerEmail) {
      return [{ id: ownerId ?? activeWorkspace.ownerEmail, name: activeWorkspace.ownerName ?? activeWorkspace.ownerEmail, email: activeWorkspace.ownerEmail }]
    }

    return []
  }, [activeWorkspace, user])

  const matchingOwners = useMemo(() => {
    const q = ownerQuery.trim().toLowerCase()
    return q ? owners.filter((owner) => `${owner.name} ${owner.email}`.toLowerCase().includes(q)) : owners
  }, [owners, ownerQuery])

  const members = useMemo(() => {
    const uniqueMembers = new Map()
    projects.forEach((project) => {
      project.members?.forEach((member) => {
        const id = member._id ?? member.uid ?? member.userId ?? member.email
        if (id) {
          uniqueMembers.set(String(id), {
            id: String(id),
            name: member.name ?? member.displayName ?? member.email ?? 'Unknown member',
            email: member.email ?? '',
          })
        }
      })
    })
    return [...uniqueMembers.values()]
  }, [projects])

  const matchingMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase()
    return q ? members.filter((member) => `${member.name} ${member.email}`.toLowerCase().includes(q)) : members
  }, [members, memberQuery])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((project) => {
      const matchesQuery = !q || (project.name ?? '').toLowerCase().includes(q)
      const projectOwner = getOwner(project)
      const matchesOwner = !selectedOwner || projectOwner?.id === selectedOwner.id || Boolean(projectOwner?.email && projectOwner.email.toLowerCase() === selectedOwner.email.toLowerCase())
      const projectMemberIds = (project.members ?? []).map((member) => String(member._id ?? member.uid ?? member.userId ?? member.email ?? ''))
      const matchesMembers = selectedMembers.length === 0 || selectedMembers.every((member) => projectMemberIds.includes(member.id))
      const status = (project.status ?? '').toLowerCase().replaceAll('_', ' ')
      const matchesStatus = !selectedStatus || (selectedStatus === 'Active'
        ? status === 'active'
        : selectedStatus === 'Closed'
          ? status === 'closed' || status === 'completed'
          : status === 'archived')
      return matchesQuery && matchesOwner && matchesMembers && matchesStatus
    })
  }, [projects, query, selectedOwner, selectedMembers, selectedStatus])

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

      <div className="px-5 pt-2">
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
                      <span className="min-w-16 text-sm text-slate-200">{owner.name}</span>
                      <span className="truncate text-sm text-slate-400">{owner.email}</span>
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
                {selectedStatus ?? 'Status'}<ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            )}
          >
            {({ close }) => (
              <div className="py-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={selectedStatus === status}
                    onClick={() => { setSelectedStatus((current) => current === status ? null : status); close() }}
                    className="flex h-[46px] w-full items-center px-6 text-left text-lg text-slate-200 transition hover:bg-white/5"
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </Dropdown>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_160px_minmax(140px,1fr)] items-center gap-4 border-b border-white/10 px-5 py-2 text-sm text-slate-400 max-sm:grid-cols-[minmax(0,1fr)_100px]">
        <span>Name</span>
        <span className="max-sm:hidden">Members</span>
        <span className="flex items-center justify-end gap-1 font-medium"><ArrowDownUp className="h-4 w-4" /> Last modified</span>
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
