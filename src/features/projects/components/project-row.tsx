import { Link } from 'react-router-dom'
import { ListTree, MoreHorizontal } from 'lucide-react'
import { PATHS } from '../../../app/paths'
import Avatar from '../../../components/ui/avatar'

export default function ProjectRow({ project }) {
  const members = project.members ?? []
  const statusName = project.status
    ? project.status.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
    : 'Joined'

  return (
    <Link
      to={PATHS.projectDetail(project._id)}
      className="grid min-h-[74px] grid-cols-[minmax(0,1fr)_160px_minmax(140px,1fr)] items-center gap-4 border-b border-white/10 px-5 py-2 transition hover:bg-white/[0.035] max-sm:grid-cols-[minmax(0,1fr)_100px]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: project.color || '#7bc86c' }}>
          <ListTree className="h-4 w-4 text-slate-900" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-base text-slate-100">{project.name}</span>
          <span className="text-sm text-emerald-500">{statusName}</span>
        </span>
      </span>

      <span className="flex items-center -space-x-2 max-sm:hidden">
        {members.slice(0, 3).map((member, index) => (
          <Avatar key={member._id ?? member.uid ?? `${project._id}-member-${index}`} name={member.name ?? member.email ?? ''} className="h-8 w-8" />
        ))}
        {Math.max(0, (project.memberCount ?? members.length) - members.length) > 0 && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#252525] text-xs text-slate-300 ring-2 ring-[#1f1f1f]">
            +{(project.memberCount ?? members.length) - members.length}
          </span>
        )}
        {members.length === 0 && (project.memberCount ?? 0) === 0 && <span className="text-sm text-slate-500">—</span>}
        {members.length === 0 && (project.memberCount ?? 0) > 0 && <Avatar name="You" className="h-8 w-8" />}
        <span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400">
          <MoreHorizontal className="h-4 w-4" />
        </span>
      </span>
      <span className="text-right text-sm text-slate-500">—</span>
    </Link>
  )
}
