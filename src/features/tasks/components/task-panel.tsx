import { useEffect, useRef, useState } from 'react'
import { Info, Link2, Trash2, X } from 'lucide-react'
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
import Avatar from '../../../components/ui/avatar'
import { useAuth } from '../../auth/hooks/use-auth'
import { useAppDispatch } from '../../../app/hooks'
import { clearTasksError, removeTaskFromStore } from '../store/tasks.slice'
import type { ITasks } from '../types/tasks.types'
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
  const task = useTask(taskId)
  const dispatch = useAppDispatch()
  const { editTask, removeTask, addFiles, removeFile } = useTasks(projectId)
  const { members, meId } = useProjectMembers(projectId)
  const { user } = useAuth()
  const { activeWorkspace } = useWorkspace()
  const { projects } = useProjects()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const panelRef = useRef<HTMLElement>(null)
  const pendingSaves = useRef(new Set<Promise<void>>())

  // reset the text fields only when another task is opened
  useEffect(() => {
    if (task) { setTitle(task.title); setDescription(task.description ?? '') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?._id])

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

  if (!task) {
    return (
      <aside ref={panelRef} className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] items-center justify-center border-l border-white/10 bg-[#1f1f1f] text-slate-400">
        {deleting ? 'Deleting task…' : 'Loading...'}
      </aside>
    )
  }

  const taskPending = task._id.startsWith('pending-')
  const fullEdit = canEditTasks(role)
  const taskEditable = fullEdit && !deleting && !taskPending
  const statusOk = canChangeStatus(role, task, meId) && !deleting && !taskPending
  const save = (changes: ITasks.UpdatePayload) => {
    if (deleting || taskPending) return Promise.resolve()
    const pending = editTask(task._id, changes)
      .then(() => undefined)
      .catch((e: unknown) => setError(typeof e === 'string' ? e : 'Could not save'))
    pendingSaves.current.add(pending)
    void pending.finally(() => pendingSaves.current.delete(pending))
    return pending
  }

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
    if (deleting || taskPending || !window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    setDeleting(true)
    setError('')
    try {
      await Promise.all([...pendingSaves.current])
      await removeTask(task._id)
      dispatch(clearTasksError())
      onClose()
    } catch (e) {
      const message = typeof e === 'string'
        ? e
        : e && typeof e === 'object' && 'message' in e && typeof e.message === 'string'
          ? e.message
          : 'Could not delete'
      if (/task not found/i.test(message)) {
        dispatch(removeTaskFromStore(task._id))
        onClose()
        return
      }
      setError(message)
      setDeleting(false)
    }
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
  const taskProject = projects.find((project) => project._id === task.projectId)

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
            <button onClick={onDelete} disabled={deleting || taskPending} title={taskPending ? 'Task is still being created' : deleting ? 'Deleting task' : 'Delete task'} className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-rose-400 disabled:cursor-wait disabled:opacity-50">
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
          disabled={!taskEditable}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          className="mb-6 w-full rounded-md bg-transparent px-1 py-1 text-[30px] font-semibold leading-tight text-white outline-none hover:bg-white/5 focus:bg-white/5 disabled:hover:bg-transparent"
        />
        {error && <p className="mb-2 text-sm text-rose-400">{error}</p>}

        <div className="mb-4 space-y-1">
          <Row label="Assignee">
            <div className="flex min-w-0 items-center gap-3">
            <AssigneePicker members={members} assigneeId={task.assigneeId} canEdit={taskEditable} onChange={(id) => save({ assigneeId: id })} />
              {task.assigneeId && fullEdit && (
                <button disabled={!taskEditable} onClick={() => save({ assigneeId: null })} title="Unassign" className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-50">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </Row>
          <Row label="Due date">
            <div className="flex items-center gap-2">
              <DueDatePicker task={task} canEdit={taskEditable} onChange={(d) => save({ dueDate: d })} />
              {task.dueDate && fullEdit && (
                <button disabled={!taskEditable} onClick={() => save({ dueDate: null })} title="Clear due date" className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-50">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </Row>
        </div>

        <section className="mt-5 border-t border-white/10 pt-4">
          <h2 className="mb-2 px-2 text-base font-semibold text-slate-100">Project</h2>
          <Link to={PATHS.projectDetail(projectId)} className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
            <span className="h-3.5 w-3.5 rounded-sm" style={{ backgroundColor: taskProject?.color || '#8d84e8' }} />
            {taskProject?.name ?? 'Open project'}
          </Link>
        </section>

        <h3 className="mb-2 mt-5 text-sm font-medium text-slate-300">Description</h3>
        <textarea
          value={description}
          disabled={!taskEditable}
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
