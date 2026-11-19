import { useState } from 'react'
import ProjectIcon from './ProjectIcon'
import ProjectMenu from './ProjectMenu'
import EditProjectModal from './EditProjectModal'
import AvatarStack from '../ui/AvatarStack'

const TABS = [
  { key: 'list', label: 'List' },
  { key: 'board', label: 'Board' },
]

export default function ProjectHeader({ project, view, onViewChange }) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="border-b border-white/10 pb-2">
      <div className="mb-3 flex items-center gap-3">
        <ProjectIcon color={project.color} size="h-10 w-10" />
        <h1 className="truncate text-2xl font-semibold text-white">{project.name}</h1>
        <ProjectMenu project={project} onEdit={() => setEditing(true)} />

        <div className="ml-auto flex items-center gap-3">
          <AvatarStack members={project.members} total={project.memberCount} />
        </div>
      </div>

      <div className="flex items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onViewChange(t.key)}
            className={`rounded-md px-3 py-1.5 text-[15px] font-medium transition-colors ${
              view === t.key ? 'bg-blue-950 text-blue-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {editing && <EditProjectModal project={project} onClose={() => setEditing(false)} />}
    </div>
  )
}