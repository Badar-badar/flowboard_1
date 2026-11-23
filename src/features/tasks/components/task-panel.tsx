import { useEffect, useRef, useState } from 'react'
import { Check, Info, Link2, Plus, Search, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import TaskCheck from './task-check'
import AssigneePicker from './assignee-picker'
import DueDatePicker from './due-date-picker'
import AttachmentList from './attachment-list'
import { useTask, useTasks } from '../hooks/use-tasks'
import { useProjectMembers } from '../../members/hooks/use-project-members'
import { useWorkspace } from '../../workspace/hooks/use-workspace'
import { useProjects } from '../../projects/hooks/use-projects'
import { PATHS } from '../../../app/paths'
import { canChangeStatus, canEditTasks } from '../task-permissions'
import TaskComments from './task-comments'
import { tasksApi } from '../api/tasks.api'
import { useAppDispatch } from '../../../app/hooks'
import { setTaskProjectIds } from '../store/tasks.slice'
import Avatar from '../../../components/ui/avatar'
import { useAuth } from '../../auth/hooks/use-auth'
import type { ITasks } from '../types/tasks.types'
import type { IProjects } from '../../projects/types/projects.types'
import type { ReactNode } from 'react'

const relativeCreatedTime = (value?: string) => {
  if (!value) return 'just now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'just now'
  const elapsed = Math.max(0, Date.now() - date.getTime())
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * day], ['month', 30 * day], ['week', 7 * day], ['day', day], ['hour', hour], ['minute', minute],
  ]
  const [unit, duration] = units.find(([, duration]) => elapsed >= duration) ?? ['second', 1000]
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'always' }).format(-Math.floor(elapsed / duration), unit)
}

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid grid-cols-[168px_minmax(0,1fr)] items-center gap-4 py-2">
    <span className="text-sm text-slate-200">{label}</span>
    <div className="min-w-0">{children}</div>
  </div>
)

export default function TaskPanel({ taskId, projectId, role, onClose }: { taskId: string; projectId: string; role?: string; onClose: () => void }) {
  const dispatch = useAppDispatch()
  const task = useTask(taskId)
  const { editTask, removeTask, addFiles, removeFile } = useTasks(projectId)
  const { members, meId } = useProjectMembers(projectId)
  const { user } = useAuth()
  const { activeWorkspace } = useWorkspace()
  const { projects } = useProjects()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [projectPickerOpen, setProjectPickerOpen] = useState(false)
  const [projectQuery, setProjectQuery] = useState('')
  const [linkedProjectIds, setLinkedProjectIds] = useState<string[]>([])
  const [projectLinkBusy, setProjectLinkBusy] = useState(false)
  const projectPickerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)

  // reset the text fields only when another task is opened
  useEffect(() => {
    if (task) { setTitle(task.title); setDescription(task.description ?? '') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?._id])

  useEffect(() => {
    if (!task) return
    setLinkedProjectIds([...new Set([task.projectId, ...(task.projectIds ?? [])])])
  }, [task?._id, task?.projectId, task?.projectIds])

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose()
    const onOutsidePointer = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutsidePointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onOutsidePointer)
    }
  }, [onClose])

  useEffect(() => {
    if (!projectPickerOpen) return
    const closePicker = (event: MouseEvent) => {
      if (!projectPickerRef.current?.contains(event.target as Node)) setProjectPickerOpen(false)
    }
    const onPickerKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setProjectPickerOpen(false)
    }
    document.addEventListener('mousedown', closePicker)
    document.addEventListener('keydown', onPickerKey)
    return () => {
      document.removeEventListener('mousedown', closePicker)
      document.removeEventListener('keydown', onPickerKey)
    }
  }, [projectPickerOpen])

  if (!task) {
    return (
      <aside ref={panelRef} className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] items-center justify-center border-l border-white/10 bg-[#1f1f1f] text-slate-400">
        Loading...
      </aside>
    )
  }

  const fullEdit = canEditTasks(role)
  const statusOk = canChangeStatus(role, task, meId)
  const save = (changes: ITasks.UpdatePayload) => editTask(task._id, changes).catch((e: unknown) => setError(typeof e === 'string' ? e : 'Could not save'))

  const saveTitle = () => {
    const v = title.trim()
    if (v.length < 2) return setTitle(task.title)
    if (v !== task.title) save({ title: v })
  }
  const saveDescription = () => {
    const v = description.trim()
    if (v !== (task.description ?? '')) save({ description: v })
  }

  const onDelete = async () => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    try { await removeTask(task._id); onClose() } catch (e) { setError(typeof e === 'string' ? e : 'Could not delete') }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Could not copy the task link.')
    }
  }

  const done = task.status === 'done'
  const creator = task.createdBy ?? task.creator ?? task.createdById ?? (task as any).created_by ?? (task as any).creatorId
  const creatorId = typeof creator === 'string' ? creator : creator?._id ?? creator?.uid ?? creator?.userId ?? creator?.email
  const creatorMember = members.find((member) => [member._id, member.uid, member.userId, member.email].some((id) => id && String(id).toLowerCase() === String(creatorId ?? '').toLowerCase()))
  const creatorName = typeof creator === 'object' && creator
    ? creator.name ?? creator.displayName ?? creator.email ?? creatorMember?.name ?? creatorMember?.email
    : creatorMember?.name ?? creatorMember?.email ?? ([user?.uid, user?.email].includes(creatorId) ? user?.displayName ?? user?.email : undefined)
  const createdAt = task.createdAt ?? task.created_at
  const visibleProjects = projects.filter((project) => (project.name ?? '').toLowerCase().includes(projectQuery.trim().toLowerCase()))
  const toggleProjectLink = async (project: IProjects.Project) => {
    if (projectLinkBusy) return
    setProjectLinkBusy(true)
    setError('')
    try {
      const response = linkedProjectIds.includes(project._id)
        ? await tasksApi.removeProject(task._id, project._id)
        : await tasksApi.addProject(task._id, project._id)
      const nextIds = [...new Set([response.data.projectId, ...(response.data.projectIds ?? [])])]
      setLinkedProjectIds(nextIds)
      dispatch(setTaskProjectIds({ id: task._id, projectIds: nextIds }))
    } catch (requestError: unknown) {
      setError(requestError && typeof requestError === 'object' && 'message' in requestError && typeof requestError.message === 'string' ? requestError.message : 'Could not update project links')
    } finally { setProjectLinkBusy(false) }
  }

  return (
    <aside ref={panelRef} className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[560px] flex-col border-l border-white/10 bg-[#1f1f1f] text-slate-200 shadow-2xl">
      <div className="flex min-h-14 items-center gap-2 bg-[#262626] px-5 py-3 text-sm">
        <span>This task is visible to {activeWorkspace?.name || 'your workspace'}.</span>
        <Info className="h-4 w-4 shrink-0 text-slate-400" />
        <div className="ml-auto flex items-center gap-1">
          <TaskCheck done={done} disabled={!statusOk} onToggle={() => save({ status: done ? 'todo' : 'done' })} />
          <button onClick={copy} title="Copy task link" className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-white">
            <Link2 className="h-5 w-5" />
          </button>
          {fullEdit && (
            <button onClick={onDelete} title="Delete task" className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-rose-400">
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button onClick={onClose} className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      {copied && <p className="bg-emerald-500/10 px-5 py-1 text-xs text-emerald-300">Link copied</p>}

      <div className="flex-1 overflow-y-auto px-5 py-7">
        <input
          value={title}
          disabled={!fullEdit}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          className="mb-6 w-full rounded-md bg-transparent px-1 py-1 text-[30px] font-semibold leading-tight text-white outline-none hover:bg-white/5 focus:bg-white/5 disabled:hover:bg-transparent"
        />
        {error && <p className="mb-2 text-sm text-rose-400">{error}</p>}

        <div className="mb-4 space-y-1">
          <Row label="Assignee">
            <div className="flex min-w-0 items-center gap-3">
              <AssigneePicker members={members} assigneeId={task.assigneeId} canEdit={fullEdit} onChange={(id) => save({ assigneeId: id })} />
              {task.assigneeId && fullEdit && (
                <button onClick={() => save({ assigneeId: null })} title="Unassign" className="rounded p-1 text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </Row>
          <Row label="Due date">
            <div className="flex items-center gap-2">
              <DueDatePicker task={task} canEdit={fullEdit} onChange={(d) => save({ dueDate: d })} />
              {task.dueDate && fullEdit && (
                <button onClick={() => save({ dueDate: null })} title="Clear due date" className="rounded p-1 text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </Row>
        </div>

        <section className="mt-5 border-t border-white/10 pt-4">
          <div ref={projectPickerRef} className="relative mb-2 flex items-center gap-2 px-2">
            <h2 className="text-base font-semibold text-slate-100">Projects</h2>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-slate-300">{linkedProjectIds.length}</span>
            <button type="button" disabled={!fullEdit} onClick={() => { setProjectPickerOpen((open) => !open); setProjectQuery('') }} aria-expanded={projectPickerOpen} aria-label="Add task to another project" title={fullEdit ? 'Add to project' : 'Editor access is required'} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-4 w-4" /></button>
            {projectPickerOpen && <div className="absolute left-0 right-0 top-8 z-40 overflow-hidden rounded-lg border border-white/10 bg-[#292a2c] shadow-2xl">
              <div className="border-b border-white/10 p-2"><label className="flex h-9 items-center gap-2 rounded-md border border-white/10 px-2.5"><Search className="h-4 w-4 text-slate-500" /><input autoFocus value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder="Project name" aria-label="Find a project" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />{projectLinkBusy && <span className="text-xs text-slate-500">Saving...</span>}</label></div>
              <div className="asana-scroll max-h-64 overflow-y-auto p-1">
                {visibleProjects.map((item) => {
                  const selected = linkedProjectIds.includes(item._id)
                  return <button key={item._id} type="button" disabled={projectLinkBusy || !fullEdit || selected && linkedProjectIds.length <= 1} onClick={() => toggleProjectLink(item)} className="flex min-h-11 w-full items-center gap-3 rounded-md px-2.5 text-left transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50">
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-100">{item.name}{selected && <span className="ml-2 text-xs text-slate-500">Added</span>}</span>
                    <span className="flex items-center -space-x-2">{item.members?.slice(0, 2).map((member, index) => <Avatar key={member._id ?? member.uid ?? `${item._id}-${index}`} name={member.name ?? member.email ?? ''} className="h-7 w-7" />)}{(item.memberCount ?? 0) > 2 && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3a3b3d] text-[10px] text-slate-300">+{(item.memberCount ?? 0) - 2}</span>}</span>
                    {selected && <Check className="h-4 w-4 text-blue-300" />}
                  </button>
                })}
                {!visibleProjects.length && <p className="px-3 py-5 text-center text-sm text-slate-500">No projects found</p>}
              </div>
            </div>}
          </div>
          <div className="space-y-1">{linkedProjectIds.map((id) => {
            const linkedProject = projects.find((item) => item._id === id)
            if (!linkedProject) return null
            return <Link key={id} to={PATHS.projectDetail(id)} className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"><span className="h-3.5 w-3.5 rounded-sm" style={{ backgroundColor: linkedProject.color || '#8d84e8' }} />{linkedProject.name}</Link>
          })}</div>
        </section>

        <h3 className="mb-2 mt-5 text-sm font-medium text-slate-300">Description</h3>
        <textarea
          value={description}
          disabled={!fullEdit}
          rows={5}
          maxLength={1000}
          placeholder={fullEdit ? 'What is this task about?' : 'No description'}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveDescription}
          className="w-full rounded-lg border border-white/15 bg-white/5 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-white/40 disabled:opacity-70"
        />

        <div className="mt-6">
          <AttachmentList
            attachments={task.attachments}
            canEdit={statusOk}
            onUpload={(files) => addFiles(task._id, files)}
            onRemove={(attachmentId) => removeFile(task._id, attachmentId)}
          />
        </div>

        <div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5 text-sm text-slate-400">
          <Avatar name={creatorName ?? 'Unknown member'} className="h-9 w-9 bg-amber-300 text-sm text-slate-900 ring-0" />
          <p><span className="font-semibold text-slate-200">{creatorName ?? 'Unknown member'}</span> created this task <span className="text-slate-500">· {relativeCreatedTime(createdAt)}</span></p>
        </div>

        <TaskComments taskId={task._id} projectId={projectId} role={role} />
      </div>
    </aside>
  )
}
