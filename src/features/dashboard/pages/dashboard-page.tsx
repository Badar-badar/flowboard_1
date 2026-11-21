import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, CircleCheck, Clock3, LockKeyhole, MoreHorizontal, Plus, Users } from 'lucide-react'
import Avatar from '../../../components/ui/avatar'
import Dropdown from '../../../components/ui/dropdown'
import { useAppDispatch } from '../../../app/hooks'
import { useAuth } from '../../auth/hooks/use-auth'
import { useWorkspace } from '../../workspace/hooks/use-workspace'
import { useProjects } from '../../projects/hooks/use-projects'
import { useMyTasks } from '../../tasks/hooks/use-tasks'
import TaskCheck from '../../tasks/components/task-check'
import TaskPanel from '../../tasks/components/task-panel'
import { createTask, fetchMyTasks } from '../../tasks/store/tasks.thunks'
import { canEditTasks } from '../../tasks/task-permissions'
import { formatDate, isOverdue } from '../../tasks/task-constants'
import { PATHS } from '../../../app/paths'

const taskTabs = ['Upcoming', 'Overdue', 'Completed']

function formatToday() {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())
}

export default function Home() {
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const { activeWorkspace } = useWorkspace()
  const { projects, loaded: projectsLoaded } = useProjects({ autoFetch: true })
  const { tasks, loaded: tasksLoaded, toggleDone } = useMyTasks()
  const [taskTab, setTaskTab] = useState('Upcoming')
  const [openedTask, setOpenedTask] = useState<any>(null)
  const [creatingTask, setCreatingTask] = useState(false)
  const [error, setError] = useState('')

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    if (taskTab === 'Completed') return task.status === 'done'
    if (taskTab === 'Overdue') return isOverdue(task)
    return task.status !== 'done' && !isOverdue(task)
  }).sort((a, b) => {
    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    return aDate - bDate
  }), [tasks, taskTab])

  const completedCount = tasks.filter((task) => task.status === 'done').length
  const collaboratorCount = new Set(tasks.flatMap((task) => projects.find((project) => project._id === task.projectId)?.members?.map((member) => member._id ?? member.uid).filter(Boolean) ?? [])).size
  const editableProject = projects.find((project) => canEditTasks(project.role))
  const recentProjects = [...projects].sort((a, b) => new Date(b.createdAt ?? b.created_at ?? 0).getTime() - new Date(a.createdAt ?? a.created_at ?? 0).getTime())

  const addTask = async () => {
    if (!editableProject || creatingTask) return
    const title = window.prompt('Task name')?.trim()
    if (!title) return
    setCreatingTask(true)
    setError('')
    try {
      await dispatch(createTask({ projectId: editableProject._id, data: { title, status: 'todo' } })).unwrap()
      await dispatch(fetchMyTasks()).unwrap()
    } catch (requestError) {
      setError(typeof requestError === 'string' ? requestError : 'Could not create task')
    } finally {
      setCreatingTask(false)
    }
  }

  return (
    <div className="min-h-full bg-[#1e1f21] px-5 py-7 text-slate-200 md:px-8 md:py-8 xl:px-9">
      <div className="mx-auto max-w-[1440px]">
        <p className="mb-3 text-[16px] font-semibold leading-6 text-slate-200">{formatToday()}</p>
        <div className="mb-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 lg:flex-nowrap">
          <h1 className="min-w-0 shrink-0 text-[32px] font-normal leading-[1.2] tracking-tight text-slate-100 md:text-[36px]">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there'}</h1>
          <div className="flex min-w-0 flex-wrap items-center justify-start gap-x-4 gap-y-2 text-[14px] text-slate-400 lg:flex-nowrap lg:justify-end">
            <Dropdown width="w-40" trigger={({ open, toggle }) => <button type="button" aria-expanded={open} onClick={toggle} className="inline-flex items-center gap-1.5 font-medium hover:text-white">My week <ChevronDown className="h-4 w-4" /></button>}>
              <div className="px-3 py-2 text-sm text-slate-400">Your tasks for this week</div>
            </Dropdown>
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" />{completedCount} tasks completed</span>
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{collaboratorCount || 1} collaborators</span>
            <button type="button" aria-label="Add widgets" className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 px-3 text-slate-200 transition hover:bg-white/5"><Plus className="h-4 w-4" />Add widgets</button>
          </div>
        </div>

        {error && <p role="alert" className="mb-4 rounded-lg bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{error}</p>}

        <div className="grid items-stretch gap-5 lg:grid-cols-2 lg:gap-5">
          <section className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#292a2c] shadow-sm">
            <div className="flex items-center justify-between gap-3 px-6 pt-6">
              <div className="flex min-w-0 items-center gap-3.5">
                <Avatar name={user?.displayName ?? user?.email ?? ''} size="h-9 w-9" className="text-xs ring-0" />
                <h2 className="text-[24px] font-semibold leading-8 text-slate-100">My tasks</h2>
                <LockKeyhole className="h-4 w-4 text-slate-400" aria-label="Private tasks" />
              </div>
              <Dropdown width="w-48" align="right" trigger={({ open, toggle }) => <button type="button" aria-label="My tasks options" aria-expanded={open} onClick={toggle} className="rounded p-2 text-slate-400 hover:bg-white/5 hover:text-white"><MoreHorizontal className="h-5 w-5" /></button>}>
                <Link to={PATHS.tasks} className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/5">Open My tasks</Link>
              </Dropdown>
            </div>
            <div className="mt-3 flex gap-1 border-b border-white/10 px-6">
              {taskTabs.map((tab) => <button key={tab} type="button" onClick={() => setTaskTab(tab)} className={`rounded-t-lg px-3 py-2 text-[15px] font-semibold leading-6 transition ${taskTab === tab ? 'bg-blue-950 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>{tab}{tab === 'Overdue' && visibleTasks.length > 0 && taskTab === tab ? ` (${visibleTasks.length})` : tab === 'Overdue' && tasks.filter(isOverdue).length > 0 ? ` (${tasks.filter(isOverdue).length})` : ''}</button>)}
            </div>
            <div className="flex-1 px-6">
              <button type="button" disabled={!editableProject || creatingTask} onClick={addTask} className="flex h-[62px] w-full items-center gap-2 border-b border-white/10 text-[15px] font-medium text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-5 w-5" />{creatingTask ? 'Creating task...' : 'Create task'}</button>
              {!tasksLoaded ? <p className="py-8 text-center text-sm text-slate-500">Loading tasks...</p> : visibleTasks.length ? <div>
                {visibleTasks.slice(0, 8).map((task) => <div key={task._id} className="flex min-h-[54px] items-center gap-3 border-b border-white/[0.06] px-1 hover:bg-white/[0.03]">
                  <TaskCheck done={task.status === 'done'} disabled={false} onToggle={() => toggleDone(task).catch(() => {})} />
                  <button type="button" onClick={() => setOpenedTask(task)} className={`min-w-0 flex-1 truncate py-3 text-left text-[16px] leading-6 ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{task.title}</button>
                  <button type="button" onClick={() => setOpenedTask(task)} title={task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'Set due date'} className={`rounded-full p-1.5 ${isOverdue(task) ? 'text-rose-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                    {task.dueDate ? <span className="inline-flex items-center gap-1 text-xs"><Clock3 className="h-4 w-4" />{formatDate(task.dueDate)}</span> : <Clock3 className="h-5 w-5" />}
                  </button>
                </div>)}
                {visibleTasks.length > 8 && <Link to={PATHS.tasks} className="mt-3 inline-block text-sm text-slate-400 hover:text-white">See all {visibleTasks.length} tasks</Link>}
              </div> : <p className="py-10 text-center text-sm text-slate-500">{taskTab === 'Overdue' ? 'No overdue tasks' : taskTab === 'Completed' ? 'No completed tasks yet' : 'You’re all caught up'}</p>}
            </div>
          </section>

          <section className="min-h-[560px] rounded-xl border border-white/10 bg-[#292a2c] px-6 py-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-5"><h2 className="text-[24px] font-semibold leading-8 text-slate-100">Projects</h2><Dropdown width="w-36" trigger={({ open, toggle }) => <button type="button" aria-expanded={open} onClick={toggle} className="inline-flex items-center gap-1 text-[15px] font-medium text-slate-400 hover:text-white">Recents <ChevronDown className="h-4 w-4" /></button>}><div className="px-3 py-2 text-sm text-slate-400">Sorted by recently created</div></Dropdown></div>
              <Dropdown width="w-44" align="right" trigger={({ open, toggle }) => <button type="button" aria-label="Project options" aria-expanded={open} onClick={toggle} className="rounded p-2 text-slate-400 hover:bg-white/5 hover:text-white"><MoreHorizontal className="h-5 w-5" /></button>}><Link to={PATHS.projects} className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/5">View all projects</Link></Dropdown>
            </div>
            <Link to={PATHS.newProject} className="mb-4 flex h-[76px] items-center gap-5 rounded-lg px-4 text-slate-400 transition hover:bg-white/[0.04] hover:text-white"><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-400"><Plus className="h-6 w-6" /></span><span className="text-[16px] font-semibold">Create project</span></Link>
            {!projectsLoaded ? <p className="px-4 py-6 text-sm text-slate-500">Loading projects...</p> : recentProjects.length ? recentProjects.slice(0, 6).map((project) => <Link key={project._id} to={PATHS.projectDetail(project._id)} className="flex min-h-[82px] items-center gap-5 rounded-lg px-4 transition hover:bg-white/[0.04]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: project.color || '#d946ef' }}><CircleCheck className="h-6 w-6 text-[#1e1f21]" />
              </span>
              <span className="min-w-0"><span className="block truncate text-[16px] font-semibold leading-6 text-slate-100">{project.name}</span>{(project.taskStats?.total ?? 0) - (project.taskStats?.done ?? 0) > 0 && <span className="mt-0.5 block text-[14px] leading-5 text-slate-400">{project.taskStats!.total - project.taskStats!.done} task{project.taskStats!.total - project.taskStats!.done === 1 ? '' : 's'} due soon</span>}</span>
              <span className="ml-auto flex -space-x-2">{project.members?.slice(0, 3).map((member, index) => <Avatar key={member._id ?? member.uid ?? `${project._id}-${index}`} name={member.name ?? member.displayName ?? member.email ?? ''} className="h-7 w-7 border-2 border-[#28292b] text-[10px]" />)}</span>
            </Link>) : <div className="px-4 py-6 text-sm text-slate-400">No projects yet. Create one to get started.</div>}
          </section>
        </div>

      </div>

      {openedTask && <TaskPanel key={openedTask._id} taskId={openedTask._id} projectId={openedTask.projectId} role={projects.find((project) => project._id === openedTask.projectId)?.role} onClose={() => setOpenedTask(null)} />}
    </div>
  )
}
