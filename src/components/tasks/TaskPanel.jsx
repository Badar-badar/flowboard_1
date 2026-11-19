import { useEffect, useState } from 'react'
import { ChevronDown, Info, Link2, Plus, Search, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import TaskCheck from './TaskCheck'
import AssigneePicker from './AssigneePicker'
import DueDatePicker from './DueDatePicker'
import AttachmentList from './AttachmentList'
import { useTask, useTasks } from '../../features/tasks/useTasks'
import { useProjectMembers } from '../../features/members/useProjectMembers'
import { useWorkspace } from '../../features/workspace/useWorkspace'
import { useProjects } from '../../features/projects/useProjects'
import ProjectsTable from '../projects/ProjectsTable'
import { PATHS } from '../../routes/paths'
import { canChangeStatus, canEditTasks } from '../../lib/taskPermissions'

const Row = ({ label, children }) => (
  <div className="grid grid-cols-[168px_minmax(0,1fr)] items-center gap-4 py-2">
    <span className="text-sm text-slate-200">{label}</span>
    <div className="min-w-0">{children}</div>
  </div>
)

export default function TaskPanel({ taskId, projectId, role, onClose }) {
  const task = useTask(taskId)
  const { editTask, removeTask, addFiles, removeFile } = useTasks(projectId)
  const { members, meId } = useProjectMembers(projectId)
  const { activeWorkspace } = useWorkspace()
  const { projects } = useProjects({ autoFetch: true })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [projectSearchOpen, setProjectSearchOpen] = useState(false)
  const [projectQuery, setProjectQuery] = useState('')

  // reset the text fields only when another task is opened
  useEffect(() => {
    if (task) { setTitle(task.title); setDescription(task.description ?? '') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?._id])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!task) {
    return (
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] items-center justify-center border-l border-white/10 bg-[#1f1f1f] text-slate-400">
        Loading...
      </aside>
    )
  }

  const fullEdit = canEditTasks(role)
  const statusOk = canChangeStatus(role, task, meId)
  const save = (changes) => editTask(task._id, changes).catch((e) => setError(typeof e === 'string' ? e : 'Could not save'))

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
    } catch { /* ignore */ }
  }

  const done = task.status === 'done'
  const visibleProjects = projects.filter((project) =>
    (project.name ?? '').toLowerCase().includes(projectQuery.trim().toLowerCase())
  )

  return (
    <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[560px] flex-col border-l border-white/10 bg-[#1f1f1f] text-slate-200 shadow-2xl">
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
              <span className="ml-auto flex shrink-0 items-center gap-1 text-sm text-slate-500">
                Recently assigned <ChevronDown className="h-4 w-4" />
              </span>
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
          <Row label="Dependencies">
            <span className="text-sm text-slate-500">Add dependencies</span>
          </Row>
        </div>

        <section className="mt-5 border-t border-white/10 pt-4">
          <div className="mb-2 flex items-center gap-2 px-2">
            <h2 className="text-base font-semibold text-slate-100">Projects</h2>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-slate-300">{projects.length}</span>
            <Link to={PATHS.newProject} title="Create project" className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white">
              <Plus className="h-4 w-4" />
            </Link>
            <div className="ml-auto flex items-center">
              {projectSearchOpen && (
                <input
                  autoFocus
                  value={projectQuery}
                  onChange={(event) => setProjectQuery(event.target.value)}
                  placeholder="Search projects"
                  aria-label="Search projects"
                  className="mr-1 w-36 rounded border border-white/10 bg-[#252628] px-2 py-1 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/30"
                />
              )}
              <button
                type="button"
                title={projectSearchOpen ? 'Close project search' : 'Search projects'}
                onClick={() => {
                  setProjectSearchOpen((open) => !open)
                  if (projectSearchOpen) setProjectQuery('')
                }}
                className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <ProjectsTable projects={visibleProjects} />
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
      </div>
    </aside>
  )
}
