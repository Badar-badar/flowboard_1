import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { PATHS } from '../../routes/paths'

export default function ProjectRow({ project }) {
  const sectionName = project.section?.name ?? project.sectionName
  const statusName = project.status
    ? project.status.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
    : null
  const rowLabel = sectionName || statusName || 'Untitled section'

  return (
    <Link
      to={PATHS.projectDetail(project._id)}
      className="grid min-h-11 grid-cols-[minmax(0,1fr)_minmax(120px,auto)] items-center gap-4 rounded-lg px-2 py-2 text-sm hover:bg-white/5"
    >
      <span className="flex min-w-0 items-center gap-2">
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="h-5 w-5 shrink-0 rounded-md" style={{ backgroundColor: project.color || '#e879f9' }} />
        <span className="truncate text-base text-slate-100">{project.name}</span>
      </span>
      <span className="flex min-w-0 items-center gap-3 text-slate-400">
        <span className="truncate">{rowLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </span>
    </Link>
  )
}
