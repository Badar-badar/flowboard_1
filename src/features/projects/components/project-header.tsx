import { useState } from 'react'
import { Check, Circle, Grid2X2, Plus, Share2, Star } from 'lucide-react'
import ProjectIcon from './project-icon'
import ProjectMenu from './project-menu'
import EditProjectModal from './edit-project-modal'
import AvatarStack from '../../../components/ui/avatar-stack'
import Dropdown from '../../../components/ui/dropdown'
import { PROJECT_STATUSES } from '../project-constants'
import { useProjects } from '../hooks/use-projects'
import InviteMembersModal from '../../members/components/invite-members-modal'
import type { IProjects } from '../types/projects.types'
import type { Dispatch, SetStateAction } from 'react'
import { useWorkspace } from '../../workspace/hooks/use-workspace'

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'list', label: 'List' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'dashboard', label: 'Dashboard' },
]

export default function ProjectHeader({ project, view, onViewChange }: { project: IProjects.Project; view: string; onViewChange: Dispatch<SetStateAction<string>> }) {
  const [editing, setEditing] = useState(false)
  const [favorite, setFavorite] = useState(Boolean(project.isFavorite))
  const [copied, setCopied] = useState(false)
  const [inviting, setInviting] = useState(false)
  const { editProject, toggleFavorite: toggleFavoriteRequest } = useProjects()
  const { activeId: workspaceId } = useWorkspace()
  const status = PROJECT_STATUSES.find((item) => item.value === project.status)

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const toggleFavorite = async () => {
    const next = !favorite
    setFavorite(next)
    try { await toggleFavoriteRequest(project._id) } catch { setFavorite(!next) }
  }

  return (
    <div className="-mx-4 -mt-4 border-b border-white/10 md:-mx-5 md:-mt-5">
      <div className="flex min-h-[54px] items-center gap-2.5 px-5 py-2 md:px-6">
        <ProjectIcon color={project.color} size="h-8 w-8" />
        <h1 className="ml-2 max-w-[42vw] truncate text-2xl font-semibold tracking-tight text-white">{project.name}</h1>
        <ProjectMenu project={project} onEdit={() => setEditing(true)} />
        <button
          type="button"
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          title={favorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={toggleFavorite}
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-amber-300"
        >
          <Star className={`h-4 w-4 ${favorite ? 'fill-amber-300 text-amber-300' : ''}`} />
        </button>
        <Dropdown
          width="w-52"
          trigger={({ open, toggle }) => (
            <button type="button" aria-expanded={open} onClick={toggle} className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
              <Circle className={`h-4 w-4 ${status?.className ?? 'text-slate-400'}`} />
              {status?.label ?? 'Set status'}
            </button>
          )}
        >
          {({ close }) => (
            <div className="py-1">
              {PROJECT_STATUSES.map((item) => (
                <button key={item.value} type="button" onClick={() => { editProject(project._id, { status: item.value }).catch(() => {}); close() }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5">
                  <Circle className={`h-4 w-4 ${item.className}`} />{item.label}
                  {item.value === project.status && <Check className="ml-auto h-4 w-4 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </Dropdown>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="group/members relative flex items-center">
            <AvatarStack members={project.members} total={project.memberCount} />
            {project.role === 'admin' && <button type="button" onClick={() => setInviting(true)} className="absolute -right-2 -top-2 rounded-full border border-[#1e1f21] bg-blue-500 p-1 text-white opacity-0 shadow transition-opacity hover:bg-blue-400 group-hover/members:opacity-100 group-focus-within/members:opacity-100" aria-label="Invite project members" title="Invite members"><Plus className="h-3.5 w-3.5" /></button>}
          </div>
          <button type="button" onClick={share} className="inline-flex h-8 items-center gap-2 rounded-lg bg-blue-500 px-4 text-sm font-medium text-white transition hover:bg-blue-400">
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}{copied ? 'Copied' : 'Share'}
          </button>
          <button type="button" onClick={() => setEditing(true)} className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm text-slate-100 transition hover:bg-white/5">
            <Grid2X2 className="h-4 w-4 text-slate-400" />Customize
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto px-5 py-2 md:px-6">
        {tabs.map((tab) => {
          const active = tab.key === view
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => tab.key === 'overview' || tab.key === 'list' ? onViewChange(tab.key) : undefined}
              title={tab.key === 'overview' || tab.key === 'list' ? undefined : `${tab.label} view coming soon`}
              className={`shrink-0 rounded-t-lg px-3 py-2 text-base font-semibold transition-colors ${active ? 'bg-blue-950 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`}
            >
              {tab.label}
            </button>
          )
        })}
        <Dropdown
          width="w-40"
          trigger={({ toggle }) => <button type="button" onClick={toggle} title="Add view" className="ml-1 rounded-md p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><Plus className="h-5 w-5" /></button>}
        >
          {({ close }) => (
            <button type="button" onClick={() => { onViewChange('board'); close() }} className="w-full px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5">Board view</button>
          )}
        </Dropdown>
      </div>
      {editing && <EditProjectModal project={project} onClose={() => setEditing(false)} />}
      {inviting && <InviteMembersModal scope="project" projectId={project._id} projectName={project.name} workspaceId={workspaceId ?? undefined} onClose={() => setInviting(false)} />}
    </div>
  )
}
