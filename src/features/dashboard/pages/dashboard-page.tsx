import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Check, ChevronDown, ChevronRight, CircleCheck, Clock3, LockKeyhole, MoreHorizontal, Plus, Users, X } from 'lucide-react'
import Avatar from '../../../components/ui/avatar'
import Dropdown from '../../../components/ui/dropdown'
import { useAppDispatch } from '../../../app/hooks'
import { useAuth } from '../../auth/hooks/use-auth'
import { useProjects } from '../../projects/hooks/use-projects'
import { useMyTasks } from '../../tasks/hooks/use-tasks'
import TaskCheck from '../../tasks/components/task-check'
import TaskPanel from '../../tasks/components/task-panel'
import { createTask, fetchMyTasks } from '../../tasks/store/tasks.thunks'
import { includeCreatedTaskInMyTasks } from '../../tasks/store/tasks.slice'
import { canEditTasks } from '../../tasks/task-permissions'
import { formatDate, isOverdue } from '../../tasks/task-constants'
import type { ITasks } from '../../tasks/types/tasks.types'
import { membersApi } from '../../members/api/members.api'
import { PATHS } from '../../../app/paths'

const taskTabs = ['Upcoming', 'Overdue', 'Completed']

function formatToday() {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())
}

export default function Home() {
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const { projects, loaded: projectsLoaded } = useProjects()
  const { tasks, loaded: tasksLoaded, toggleDone } = useMyTasks()
  const [taskTab, setTaskTab] = useState('Upcoming')
  const [weekRange, setWeekRange] = useState('week')
  const [projectSort, setProjectSort] = useState('recent')
  const [openedTask, setOpenedTask] = useState<any>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [optimisticTask, setOptimisticTask] = useState<ITasks.Task | null>(null)
  const [creatingTask, setCreatingTask] = useState(false)
  const [error, setError] = useState('')
  const taskInputRef = useRef<HTMLInputElement>(null)

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    if (taskTab === 'Completed') return task.status === 'done'
    if (taskTab === 'Overdue') return isOverdue(task)
    if (task.status === 'done' || isOverdue(task)) return false
    if (weekRange === 'all') return true
    const due = task.dueDate ? new Date(task.dueDate) : null
    const now = new Date()
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() + 7)
    return !due || due <= weekEnd
  }).sort((a, b) => {
    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    return aDate - bDate
  }), [tasks, taskTab, weekRange])
  const taskRows = useMemo(() => optimisticTask && taskTab === 'Upcoming'
    ? [optimisticTask, ...visibleTasks.filter((task) => task._id !== optimisticTask._id)].slice(0, 8)
    : visibleTasks.slice(0, 8), [optimisticTask, taskTab, visibleTasks])

  const completedCount = tasks.filter((task) => task.status === 'done').length
  const collaboratorCount = new Set(tasks.flatMap((task) => projects.find((project) => project._id === task.projectId)?.members?.map((member) => member._id ?? member.uid).filter(Boolean) ?? [])).size
  const editableProject = projects.find((project) => canEditTasks(project.role))
  const recentProjects = [...projects].sort((a, b) => projectSort === 'name'
    ? (a.name ?? '').localeCompare(b.name ?? '')
    : projectSort === 'updated'
      ? new Date((b as any).updatedAt ?? (b as any).updated_at ?? b.createdAt ?? b.created_at ?? 0).getTime() - new Date((a as any).updatedAt ?? (a as any).updated_at ?? a.createdAt ?? a.created_at ?? 0).getTime()
      : new Date(b.createdAt ?? b.created_at ?? 0).getTime() - new Date(a.createdAt ?? a.created_at ?? 0).getTime())

  const closeTaskComposer = () => {
    if (creatingTask) return
    setComposerOpen(false)
    setTaskTitle('')
    setTaskDueDate('')
    setError('')
  }

  const addTask = async (openAfterCreate = false) => {
    const title = taskTitle.trim()
    if (!editableProject || creatingTask || title.length < 2) return
    const temporaryTask: ITasks.Task = {
      _id: `optimistic-${Date.now()}`,
      projectId: editableProject._id,
      title,
      status: 'todo',
      dueDate: taskDueDate || undefined,
    }
    setOptimisticTask(temporaryTask)
    setTaskTab('Upcoming')
    setComposerOpen(false)
    setCreatingTask(true)
    setError('')
    let createdTask: ITasks.Task
    try {
      const projectMembers = (await membersApi.getByProject(editableProject._id)).data
      const currentMember = projectMembers.find((member) =>
        (user?.email && member.email?.toLowerCase() === user.email.toLowerCase())
        || (user?.uid && (member.uid === user.uid || member.userId === user.uid)),
      )
      const assigneeId = currentMember?._id
      if (!assigneeId) throw new Error('Could not find your membership in the selected project. Choose another project or ask an admin to add you.')

      createdTask = await dispatch(createTask({
        projectId: editableProject._id,
        data: { title, status: 'todo', dueDate: taskDueDate || undefined, assigneeId },
      })).unwrap()
    } catch (requestError) {
      setOptimisticTask(null)
      setError(typeof requestError === 'string' ? requestError : requestError instanceof Error ? requestError.message : 'Could not create task')
      setComposerOpen(true)
      setCreatingTask(false)
      return
    }
    dispatch(includeCreatedTaskInMyTasks(createdTask))
    setOptimisticTask(null)
    setTaskTitle('')
    setTaskDueDate('')
    setTaskTab('Upcoming')
    if (openAfterCreate) setOpenedTask(createdTask)
    setCreatingTask(false)
    void dispatch(fetchMyTasks()).unwrap().catch(() => {
      setError('Task created, but the list could not refresh. Reload to see the latest tasks.')
    })
  }

  return (
    <div className="min-h-full text-[#F2F2F3]">
      <div className="mx-auto max-w-6xl">
        <p className="mb-1 text-sm font-medium leading-5 text-slate-400">{formatToday()}</p>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 lg:flex-nowrap">
          <h1 className="min-w-0 shrink-0 text-[30px] font-medium leading-[1.2] tracking-tight text-slate-100 md:text-[34px]">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there'}</h1>
          <div className="flex min-w-0 flex-wrap items-center justify-start gap-x-5 gap-y-2 text-[13px] text-slate-400 lg:flex-nowrap lg:justify-end">
            <Dropdown width="w-40" trigger={({ open, toggle }) => <button type="button" aria-expanded={open} onClick={toggle} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-colors duration-150 hover:bg-white/5 hover:text-slate-200">{weekRange === 'week' ? 'My week' : 'All upcoming'} <ChevronDown className="h-4 w-4" /></button>}>
              {({ close }) => <div className="py-1">{[['week', 'This week'], ['all', 'All upcoming']].map(([value, label]) => <button key={value} type="button" onClick={() => { setWeekRange(value); close() }} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 ${weekRange === value ? 'text-blue-300' : 'text-slate-200'}`}>{label}</button>)}</div>}
            </Dropdown>
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" />{completedCount} tasks completed</span>
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{collaboratorCount || 1} collaborator{(collaboratorCount || 1) === 1 ? '' : 's'}</span>
          </div>
        </div>

        {error && !composerOpen && <p role="alert" className="mb-4 rounded-lg bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{error}</p>}

        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          <section className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#292a2c] shadow-[0_2px_8px_rgba(0,0,0,.16)]">
            <div className="flex items-center justify-between gap-3 px-6 pt-6">
              <div className="flex min-w-0 items-center gap-3.5">
                <Avatar name={user?.displayName ?? user?.email ?? ''} size="h-9 w-9" className="text-xs ring-0" />
                <h2 className="text-xl font-semibold leading-8 text-slate-100 sm:text-[24px]">My tasks</h2>
                <LockKeyhole className="h-4 w-4 text-slate-400" aria-label="Private tasks" />
              </div>
              <Dropdown width="w-48" align="right" trigger={({ open, toggle }) => <button type="button" aria-label="My tasks options" aria-expanded={open} onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors duration-150 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><MoreHorizontal className="h-5 w-5" /></button>}>
                <Link to={PATHS.tasks} className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/5">Open My tasks</Link>
              </Dropdown>
            </div>
            <div className="mt-3 flex gap-1 border-b border-white/10 px-6 pb-2">
              {taskTabs.map((tab) => <button key={tab} type="button" onClick={() => setTaskTab(tab)} className={`rounded-full px-3 py-2 text-sm font-medium leading-5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${taskTab === tab ? 'bg-blue-500/15 text-blue-300' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>{tab}{tab === 'Overdue' && visibleTasks.length > 0 && taskTab === tab ? ` (${visibleTasks.length})` : tab === 'Overdue' && tasks.filter(isOverdue).length > 0 ? ` (${tasks.filter(isOverdue).length})` : ''}</button>)}
            </div>
            <div className="flex-1 px-6">
              <button type="button" disabled={!editableProject || creatingTask} aria-expanded={composerOpen} onClick={() => {
                if (composerOpen) closeTaskComposer()
                else {
                  setTaskTab('Upcoming')
                  setComposerOpen(true)
                  setError('')
                  requestAnimationFrame(() => taskInputRef.current?.focus())
                }
              }} className="flex h-[62px] w-full items-center gap-2 border-b border-white/10 text-[15px] font-medium text-zinc-300 transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-5 w-5" />Create task</button>
              {composerOpen && <div className="border-b border-blue-400/70 bg-[#252628]" onKeyDown={(event) => {
                if (event.key === 'Escape') { event.preventDefault(); closeTaskComposer() }
              }}>
                <div className="flex min-h-[52px] items-center gap-3 border-y border-blue-400/40 px-3">
                  <button type="button" onClick={() => addTask()} disabled={creatingTask || taskTitle.trim().length < 2} aria-label="Create task" title="Create task" className="shrink-0 rounded-full text-slate-400 transition-colors hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50">
                    <CircleCheck className="h-5 w-5" />
                  </button>
                  <input
                    ref={taskInputRef}
                    autoFocus
                    value={taskTitle}
                    disabled={creatingTask}
                    maxLength={120}
                    placeholder="Write a task name"
                    aria-label="Task name"
                    onChange={(event) => setTaskTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') { event.preventDefault(); addTask() }
                    }}
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-slate-100 outline-none placeholder:text-slate-400"
                  />
                  <label className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-dashed border-slate-500 text-slate-400 transition hover:bg-white/5 hover:text-slate-200" title={taskDueDate ? `Due ${formatDate(taskDueDate)}` : 'Set due date'}>
                    <CalendarDays className="h-4 w-4" />
                    <input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} onClick={(event) => event.currentTarget.showPicker?.()} aria-label="Due date" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                  </label>
                  {taskDueDate && <span className="hidden text-xs text-slate-300 sm:inline">{formatDate(taskDueDate)}</span>}
                  <button type="button" onClick={() => addTask(true)} disabled={creatingTask || taskTitle.trim().length < 2} aria-label="Create task and open details" title="Create and open task details" className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={closeTaskComposer} disabled={creatingTask} aria-label="Cancel task creation" title="Cancel" className="shrink-0 rounded p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"><X className="h-4 w-4" /></button>
                </div>
                {error && <p role="alert" className="px-11 py-2 text-xs text-rose-300">{error}</p>}
              </div>}
              {!tasksLoaded && !optimisticTask ? <p className="py-8 text-center text-sm text-slate-400">Loading tasks...</p> : taskRows.length ? <div>
                {taskRows.map((task) => {
                  const pending = task._id === optimisticTask?._id
                  return <div key={task._id} className={`flex min-h-[54px] items-center gap-3 border-b border-white/[0.06] px-1 hover:bg-white/[0.03] ${pending ? 'opacity-75' : ''}`}>
                    <TaskCheck done={task.status === 'done'} disabled={pending} onToggle={() => toggleDone(task).catch(() => {})} />
                    <button type="button" disabled={pending} onClick={() => setOpenedTask(task)} className={`min-w-0 flex-1 truncate py-3 text-left text-[16px] leading-6 disabled:cursor-default ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{task.title}</button>
                    <button type="button" disabled={pending} onClick={() => setOpenedTask(task)} title={task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'Set due date'} className={`rounded-full p-1.5 disabled:cursor-default ${isOverdue(task) ? 'text-rose-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                      {task.dueDate ? <span className="inline-flex items-center gap-1 text-xs"><Clock3 className="h-4 w-4" />{formatDate(task.dueDate)}</span> : <Clock3 className="h-5 w-5" />}
                    </button>
                  </div>
                })}
                {visibleTasks.length > 8 && <Link to={PATHS.tasks} className="mt-3 inline-block text-sm text-slate-400 hover:text-white">See all {visibleTasks.length} tasks</Link>}
              </div> : <div className="flex flex-1 flex-col items-center justify-center py-8 text-center text-sm text-slate-400"><CircleCheck className="mb-2 h-6 w-6 text-slate-500" /><p>{taskTab === 'Overdue' ? 'No overdue tasks' : taskTab === 'Completed' ? 'No completed tasks yet' : 'You’re all caught up'}</p></div>}
            </div>
          </section>

          <section className="min-h-[420px] rounded-2xl border border-white/[0.08] bg-[#292a2c] px-6 py-6 shadow-[0_2px_8px_rgba(0,0,0,.16)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-5"><h2 className="text-[24px] font-semibold leading-8 text-slate-100">Projects</h2><Dropdown width="w-40" trigger={({ open, toggle }) => <button type="button" aria-expanded={open} onClick={toggle} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[15px] font-medium text-zinc-400 transition-colors duration-150 hover:bg-white/5 hover:text-white">{projectSort === 'name' ? 'Name' : projectSort === 'updated' ? 'Recently updated' : 'Recents'} <ChevronDown className="h-4 w-4" /></button>}>
                {({ close }) => <div className="py-1">{[['recent', 'Recently created'], ['updated', 'Recently updated'], ['name', 'Name']].map(([value, label]) => <button key={value} type="button" onClick={() => { setProjectSort(value); close() }} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 ${projectSort === value ? 'text-blue-300' : 'text-slate-200'}`}>{label}</button>)}</div>}
              </Dropdown></div>
              <Dropdown width="w-44" align="right" trigger={({ open, toggle }) => <button type="button" aria-label="Project options" aria-expanded={open} onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors duration-150 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><MoreHorizontal className="h-5 w-5" /></button>}><Link to={PATHS.projects} className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/5">View all projects</Link></Dropdown>
            </div>
            <Link to={PATHS.newProject} className="group mb-4 flex h-[76px] items-center gap-5 rounded-xl px-4 text-zinc-300 transition-colors duration-150 hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><span className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-zinc-400 transition-colors duration-150 group-hover:border-blue-300"><Plus className="h-6 w-6 text-zinc-300 group-hover:text-blue-300" /></span><span className="text-[16px] font-medium">Create project</span></Link>
            {!projectsLoaded ? <p className="px-4 py-6 text-sm text-zinc-400">Loading projects...</p> : recentProjects.length ? recentProjects.slice(0, 6).map((project) => <Link key={project._id} to={PATHS.projectDetail(project._id)} className="flex min-h-[82px] items-center gap-5 rounded-xl px-3 transition-colors duration-150 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: project.color || '#d946ef' }}><CircleCheck className="h-6 w-6 text-[#1e1f21]" />
              </span>
              <span className="min-w-0"><span className="block truncate text-[16px] font-semibold leading-6 text-slate-100">{project.name}</span>{(project.taskStats?.total ?? 0) - (project.taskStats?.done ?? 0) > 0 && <span className="mt-0.5 block text-[14px] leading-5 text-slate-400">{project.taskStats!.total - project.taskStats!.done} task{project.taskStats!.total - project.taskStats!.done === 1 ? '' : 's'} due soon</span>}</span>
              <span className="ml-auto flex -space-x-2">{project.members?.slice(0, 3).map((member, index) => <Avatar key={member._id ?? member.uid ?? `${project._id}-${index}`} name={member.name ?? member.displayName ?? member.email ?? (member._id || member.uid || member.userId ? `Member ${String(member._id ?? member.uid ?? member.userId).slice(-4)}` : 'Member')} className="h-7 w-7 border-2 border-[#292a2c] text-xs font-medium" />)}</span>
            </Link>) : <div className="px-4 py-6 text-sm text-slate-400">No projects yet. Create one to get started.</div>}
          </section>
        </div>

      </div>

      {openedTask && <TaskPanel key={openedTask._id} taskId={openedTask._id} projectId={openedTask.projectId} role={projects.find((project) => project._id === openedTask.projectId)?.role} onClose={() => setOpenedTask(null)} />}
    </div>
  )
}
