import { useEffect, useState } from 'react'
import { Check, Pencil, X } from 'lucide-react'
import Avatar from '../../../components/ui/avatar'
import { useAuth } from '../../auth/hooks/use-auth'
import { useProjectMembers } from '../../members/hooks/use-project-members'
import { useProjects } from '../hooks/use-projects'
import InviteMembersModal from '../../members/components/invite-members-modal'
import type { IProjects } from '../types/projects.types'
import type { IMembers } from '../../members/types/members.types'
import { useWorkspace } from '../../workspace/hooks/use-workspace'

type PersonLike = { name?: string; displayName?: string | null; email?: string | null } | null
const nameOf = (person?: PersonLike) => person?.name ?? person?.displayName ?? person?.email ?? 'You'
const formattedTime = (value?: string | null) => {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' }).format(date)
}

function ActivityEntry({ title, time, person, line = true, showAvatar = true }: { title: string; time: string; person?: PersonLike; line?: boolean; showAvatar?: boolean }) {
  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      <div className="relative flex w-4 shrink-0 justify-center">
        <span className="z-10 mt-2 h-2 w-2 rounded-full bg-slate-400" />
        {line && <span className="absolute bottom-0 top-5 w-px bg-white/10" />}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-slate-100">{title}</p>
        <p className="mt-2 text-sm text-slate-400">{time}</p>
        {showAvatar && <Avatar name={nameOf(person)} className="mt-3 h-9 w-9" />}
      </div>
    </li>
  )
}

export default function ProjectOverview({ project }: { project: IProjects.Project }) {
  const { editProject } = useProjects()
  const { members, loaded } = useProjectMembers(project._id)
  const { activeWorkspace, activeId: workspaceId } = useWorkspace()
  const { user } = useAuth()
  const owner = project.owner
    ?? project.createdBy
    ?? (typeof project.ownerId === 'object'
      ? project.ownerId
      : project.members?.find((member) => member._id === project.ownerId))
  const ownerName = nameOf(owner ?? user)
  const createdAt = project.createdAt ?? project.created_at
  const joinedAt = activeWorkspace?.createdAt ?? activeWorkspace?.created_at ?? createdAt
  const [description, setDescription] = useState(project.description ?? '')
  const [editingDescription, setEditingDescription] = useState(false)
  const [savingDescription, setSavingDescription] = useState(false)
  const [descriptionError, setDescriptionError] = useState('')
  const [inviting, setInviting] = useState(false)
  const canInvite = project.role === 'admin'

  useEffect(() => {
    setDescription(project.description ?? '')
  }, [project._id, project.description])

  const saveDescription = async () => {
    setSavingDescription(true)
    setDescriptionError('')
    try {
      await editProject(project._id, { description: description.trim() })
      setDescription(description.trim())
      setEditingDescription(false)
    } catch (error) {
      setDescriptionError(typeof error === 'string' ? error : 'Could not save project description')
    } finally {
      setSavingDescription(false)
    }
  }

  return (
    <div className="grid min-h-[calc(100dvh-12rem)] grid-cols-1 bg-[#1e1f21] lg:h-[calc(100dvh-10rem)] lg:min-h-[32rem] lg:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
      <main className="asana-scroll min-h-0 overflow-y-auto px-0 py-6">
        <section>
          <div className="flex max-w-3xl items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-slate-100">Project description</h2>
            {!editingDescription && <button type="button" onClick={() => setEditingDescription(true)} className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" />Edit</button>}
          </div>
          {editingDescription ? (
            <div className="mt-4 max-w-3xl">
              <textarea autoFocus value={description} onChange={(event) => setDescription(event.target.value)} rows={5} maxLength={2000} placeholder="What's this project about?" className="w-full resize-y rounded-lg border border-white/20 bg-[#252628] p-3 text-base leading-7 text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-400" />
              {descriptionError && <p className="mt-2 text-sm text-rose-400">{descriptionError}</p>}
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" disabled={savingDescription} onClick={() => { setDescription(project.description ?? ''); setDescriptionError(''); setEditingDescription(false) }} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"><X className="h-4 w-4" />Cancel</button>
                <button type="button" disabled={savingDescription} onClick={saveDescription} className="inline-flex items-center gap-1.5 rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50"><Check className="h-4 w-4" />{savingDescription ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setEditingDescription(true)} className="mt-4 block max-w-3xl text-left">
              <p className="whitespace-pre-wrap text-base leading-7 text-slate-400">{description.trim() || "What's this project about?"}</p>
            </button>
          )}
        </section>

        <section className="mt-20">
          <h2 className="text-2xl font-semibold text-slate-100">Project roles</h2>
          <div className="mt-5 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
            <button type="button" disabled={!canInvite} onClick={() => setInviting(true)} className="group flex h-20 items-center gap-3 rounded-lg px-3 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60" title={canInvite ? 'Invite a project member' : 'Only project admins can invite members'}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-slate-500 text-2xl leading-none">+</span>
              <span className="font-medium">Add member</span>
            </button>
            {owner && <div className="flex h-20 min-w-0 items-center gap-3 rounded-lg bg-[#252628] px-3">
              <Avatar name={ownerName} className="h-12 w-12 text-sm" />
              <div className="min-w-0"><p className="truncate font-medium text-slate-100">{ownerName}</p><p className="text-sm text-slate-400">Project owner</p></div>
            </div>}
            {loaded && members.filter((member: IMembers.Member) => {
              const ownerId = owner?._id ?? owner?.uid ?? owner?.userId ?? owner?.email
              const memberId = member._id ?? member.uid ?? member.userId ?? member.email
              return !ownerId || String(memberId) !== String(ownerId)
            }).map((member) => <div key={member._id ?? member.uid ?? member.userId ?? member.email} className="flex h-20 min-w-0 items-center gap-3 rounded-lg bg-[#252628] px-3">
              <Avatar name={nameOf(member)} className="h-12 w-12 text-sm" />
              <div className="min-w-0"><p className="truncate font-medium text-slate-100">{nameOf(member)}</p><p className="text-sm text-slate-400">{member.role ?? 'Project member'}</p></div>
            </div>)}
          </div>
        </section>
      </main>

      <aside className="asana-scroll min-h-0 overflow-y-auto border-t border-white/10 bg-[#252628] px-0 py-6 lg:border-l lg:border-t-0">
        <h2 className="text-2xl font-semibold text-slate-400">Activity</h2>
        <ol className="mt-7">
          <ActivityEntry title={`${activeWorkspace?.name ?? 'Workspace'} team joined`} time={formattedTime(joinedAt)} person={activeWorkspace?.owner ?? owner ?? user} />
          <ActivityEntry title="You joined" time={formattedTime(joinedAt)} person={user} />
          <ActivityEntry title="Project created" time={formattedTime(createdAt)} person={owner ?? user} line={false} showAvatar={false} />
        </ol>
      </aside>
      {inviting && <InviteMembersModal scope="project" projectId={project._id} projectName={project.name} workspaceId={workspaceId ?? undefined} onClose={() => setInviting(false)} />}
    </div>
  )
}
