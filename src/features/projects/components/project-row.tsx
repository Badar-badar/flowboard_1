import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListTree, MoreHorizontal, Star, UserPlus } from 'lucide-react'
import { PATHS } from '../../../app/paths'
import Avatar from '../../../components/ui/avatar'
import InviteMembersModal from '../../members/components/invite-members-modal'
import { useProjects } from '../hooks/use-projects'
import type { IProjects } from '../types/projects.types'
import { useWorkspace } from '../../workspace/hooks/use-workspace'

export default function ProjectRow({ project }: { project: IProjects.Project }) {
  const members = project.members ?? []
  const { toggleFavorite } = useProjects()
  const { activeId: workspaceId } = useWorkspace()
  const [favorite, setFavorite] = useState(Boolean(project.isFavorite))
  const [inviting, setInviting] = useState(false)
  const [savingFavorite, setSavingFavorite] = useState(false)
  const statusName = project.status
    ? project.status.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
    : 'Joined'

  useEffect(() => setFavorite(Boolean(project.isFavorite)), [project.isFavorite])

  const onFavorite = async () => {
    if (savingFavorite) return
    const previous = favorite
    setFavorite(!previous)
    setSavingFavorite(true)
    try {
      const result = await toggleFavorite(project._id)
      setFavorite(result.isFavorite)
    } catch { setFavorite(previous) }
    finally { setSavingFavorite(false) }
  }

  return (
    <div className="group/project relative grid min-h-[74px] grid-cols-[minmax(0,1fr)_160px_minmax(100px,1fr)_auto] items-center gap-2 border-b border-white/10 px-3 py-2 transition-colors hover:bg-white/[0.055] focus-within:bg-white/[0.055] max-sm:grid-cols-[minmax(0,1fr)_100px_auto] sm:gap-4 sm:px-5">
      <Link to={PATHS.projectDetail(project._id)} className="flex min-w-0 items-center gap-3 rounded outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: project.color || '#7bc86c' }}>
          <ListTree className="h-4 w-4 text-slate-900" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-base text-slate-100">{project.name}</span>
          <span className="text-sm text-emerald-500">{statusName}</span>
        </span>
      </Link>

      <span className="flex items-center -space-x-2 max-sm:hidden">
        {members.slice(0, 3).map((member, index) => (
          <Avatar key={member._id ?? member.uid ?? `${project._id}-member-${index}`} name={member.name ?? member.displayName ?? member.email ?? (member._id || member.uid || member.userId ? `Member ${String(member._id ?? member.uid ?? member.userId).slice(-4)}` : 'Member')} className="h-8 w-8" />
        ))}
        {Math.max(0, (project.memberCount ?? members.length) - members.length) > 0 && <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#252525] text-xs text-slate-300 ring-2 ring-[#1f1f1f]">+{(project.memberCount ?? members.length) - members.length}</span>}
        {members.length === 0 && (project.memberCount ?? 0) === 0 && <span className="text-sm text-slate-500">—</span>}
        {members.length === 0 && (project.memberCount ?? 0) > 0 && <Avatar name="You" className="h-8 w-8" />}
        <span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400"><MoreHorizontal className="h-4 w-4" /></span>
      </span>

      <span className="max-sm:hidden" aria-hidden="true" />
      <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/project:opacity-100 sm:group-focus-within/project:opacity-100">
        <button type="button" onClick={onFavorite} disabled={savingFavorite} aria-label={favorite ? 'Remove project from favorites' : 'Add project to favorites'} title={favorite ? 'Remove from favorites' : 'Add to favorites'} className="rounded-md p-2 text-slate-400 transition hover:bg-white/10 hover:text-amber-300 disabled:opacity-50">
          <Star className={`h-4 w-4 ${favorite ? 'fill-amber-300 text-amber-300' : ''}`} />
        </button>
        {project.role === 'admin' && <button type="button" onClick={() => setInviting(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#292a2c] px-3 text-sm font-medium text-slate-100 transition hover:bg-[#343537]" title="Invite project members"><UserPlus className="h-4 w-4 text-slate-400" />Invite</button>}
      </div>
      {inviting && <InviteMembersModal scope="project" projectId={project._id} projectName={project.name} workspaceId={workspaceId ?? undefined} onClose={() => setInviting(false)} />}
    </div>
  )
}
