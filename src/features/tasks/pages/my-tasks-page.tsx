import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, Building2, Check, ChevronDown, ChevronRight, Grid2X2, ListFilter, LockKeyhole, Plus, Search, SlidersHorizontal, TableProperties } from 'lucide-react'
import Dropdown from '../../../components/ui/dropdown'
import Avatar from '../../../components/ui/avatar'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { useAuth } from '../../auth/hooks/use-auth'
import { useWorkspace } from '../../workspace/hooks/use-workspace'
import { useProjects } from '../../projects/hooks/use-projects'
import TaskCheck from '../components/task-check'
import TaskPanel from '../components/task-panel'
import { MyTasksBoard } from '../components/task-board-view'
import { useMyTasks } from '../hooks/use-tasks'
import { createTask, fetchMyTasks, updateTask } from '../store/tasks.thunks'
import { clearTasksError } from '../store/tasks.slice'
import { projectsSelectors } from '../../projects/store/projects.slice'
import { addDaysToDateInput, formatDate, getTaskDueSection, isOverdue, TASK_DUE_SECTIONS, toDateInput } from '../task-constants'
import { canEditTasks } from '../task-permissions'
import { membersApi } from '../../members/api/members.api'
import type { ITasks } from '../types/tasks.types'
import type { ComponentType, Dispatch, ReactNode, SetStateAction } from 'react'

interface LaneDefinition { id: string; label: string; custom?: boolean; defaultDue?: string }
interface TaskColumn extends LaneDefinition { tasks: ITasks.Task[]; taskCount?: number }

const VIEWS = ['List', 'Board', 'Calendar', 'Dashboard', 'Knowledge']
const todayStr = () => toDateInput(new Date())
const BASE_LANES = TASK_DUE_SECTIONS

// due date a card gets in a lane (null = clear it, undefined = leave it alone)
const dueForLane = (id: string, today: string): string | null | undefined =>
  ({ recent: null, today, week: addDaysToDateInput(today, 3), later: addDaysToDateInput(today, 14), overdue: addDaysToDateInput(today, -1) } as Record<string, string | null>)[id]

function usePersisted<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial } catch { return initial }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
  }, [key, value])
  return [value, setValue]
}

const menuBtn = 'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white'

function ToolbarMenu({ label, Icon, width = 'w-48', children }: { label: string; Icon: ComponentType<{ className?: string }>; width?: string; children: ReactNode }) {
  return (
    <Dropdown width={width} align="right" trigger={({ open, toggle }) => (
      <button type="button" aria-expanded={open} onClick={toggle} className={menuBtn}>
        <Icon className="h-4 w-4 text-slate-400" />{label}
      </button>
    )}>
      {children}
    </Dropdown>
  )
}

const Box = ({ on }: { on: boolean }) => <span className={`h-4 w-4 rounded border ${on ? 'border-blue-400 bg-blue-400' : 'border-white/30'}`} />

// remount per workspace so each workspace keeps its own sections
export default function MyTasks() {
  const { activeId } = useWorkspace()
  return <MyTasksPage key={activeId ?? 'none'} workspaceId={activeId ?? 'none'} />
}

function MyTasksPage({ workspaceId }: { workspaceId: string }) {
  const dispatch = useAppDispatch()
  const { tasks, loaded, toggleDone } = useMyTasks()
  const { user } = useAuth()
  const { activeWorkspace } = useWorkspace()
  const { projects } = useProjects()
  const projectEntities = useAppSelector(projectsSelectors.selectEntities)
  const taskError = useAppSelector((s) => s.tasks.error)

  const [view, setView] = useState('Board')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [sortMode, setSortMode] = useState('due')
  const [hideCompleted, setHideCompleted] = useState(false)
  const [showProjects, setShowProjects] = useState(true)
  const [showDueDates, setShowDueDates] = useState(true)
  const [addingSection, setAddingSection] = useState(false)
  const [composerLane, setComposerLane] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [openedTask, setOpenedTask] = useState<ITasks.Task | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const [customLanes, setCustomLanes] = usePersisted<LaneDefinition[]>(`my-tasks:lanes:${workspaceId}`, [])
  const [deletedLanes, setDeletedLanes] = usePersisted<string[]>(`my-tasks:deleted-lanes:${workspaceId}`, [])
  const [laneNames, setLaneNames] = usePersisted<Record<string, string>>(`my-tasks:lane-names:${workspaceId}`, {})
  const [hideEmptyColumns, setHideEmptyColumns] = usePersisted(`my-tasks:hide-empty:${workspaceId}`, false)
  const [overrides, setOverrides] = usePersisted<Record<string, string>>(`my-tasks:overrides:${workspaceId}`, {})
  const [lastProject, setLastProject] = usePersisted<string>(`my-tasks:project:${workspaceId}`, '')

  const today = todayStr()

  const editableProjects = useMemo(() => projects.filter((p) => canEditTasks(p.role)), [projects])
  const defaultProjectId = editableProjects.some((p) => p._id === lastProject) ? lastProject : editableProjects[0]?._id

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks
      .filter((t) => !q || t.title.toLowerCase().includes(q) || (projectEntities[t.projectId]?.name ?? '').toLowerCase().includes(q))
      .filter((t) => filter === 'all' || (filter === 'upcoming' ? t.status !== 'done' && !isOverdue(t) : filter === 'overdue' ? isOverdue(t) : t.status === 'done'))
      .filter((t) => !hideCompleted || t.status !== 'done')
      .sort((a, b) => sortMode === 'name'
        ? a.title.localeCompare(b.title)
        : (toDateInput(a.dueDate) || '9999').localeCompare(toDateInput(b.dueDate) || '9999'))
  }, [tasks, query, filter, hideCompleted, sortMode, projectEntities])

  const lanes = useMemo<LaneDefinition[]>(
    () => [...BASE_LANES.map((l) => ({ ...l, label: laneNames[l.id] ?? l.label, custom: false })), ...customLanes.map((l) => ({ ...l, custom: true }))],
    [customLanes, laneNames],
  )

  const laneOf = useCallback((task: ITasks.Task): string => {
    const o = overrides[task._id]
    if (o && customLanes.some((l) => l.id === o)) return o
    return getTaskDueSection(task, today)
  }, [overrides, customLanes, today])

  const columns = useMemo(
    () => lanes.map((l) => {
      const laneTasks = tasks.filter((task) => laneOf(task) === l.id)
      return {
        ...l,
        defaultDue: l.custom ? undefined : dueForLane(l.id, today) || undefined,
        tasks: filteredTasks.filter((task) => laneOf(task) === l.id),
        taskCount: laneTasks.length,
      }
    }).filter((column) => !deletedLanes.includes(column.id) || column.taskCount > 0),
    [lanes, tasks, filteredTasks, laneOf, today, deletedLanes],
  )

  const moveTask = (task: ITasks.Task, lane: TaskColumn) => {
    if (laneOf(task) === lane.id) return
    if (lane.custom) {
      setOverrides((cur) => ({ ...cur, [task._id]: lane.id }))
      return
    }
    setOverrides((cur) => {
      if (!(task._id in cur)) return cur
      const next = { ...cur }
      delete next[task._id]
      return next
    })
    const dueDate = dueForLane(lane.id, today)
    if (dueDate === undefined) return
    dispatch(updateTask({ id: task._id, changes: { dueDate } })).unwrap().catch(() => {})
  }

  const addLane = (label: string) => {
    setHideEmptyColumns(false)
    setCustomLanes((cur) => [...cur, { id: `custom-${Date.now()}`, label }])
  }
  const removeLane = (lane: TaskColumn) => {
    if ((lane.taskCount ?? lane.tasks.length) > 0) return
    if (lane.custom) setCustomLanes((cur) => cur.filter((item) => item.id !== lane.id))
    else setDeletedLanes((current) => current.includes(lane.id) ? current : [...current, lane.id])
  }

  // create inside a column, assigned to me
  const createInLane = async (lane: TaskColumn, title: string, projectId: string, due: string) => {
    setLastProject(projectId)

    // the full members list, so "me" is found even when the project has more than 3 members
    const members = (await membersApi.getByProject(projectId)).data
    const me = members.find((m) => m.email?.toLowerCase() === user?.email?.toLowerCase())

    const task = await dispatch(createTask({
      projectId,
      data: { title, status: 'todo', dueDate: due || undefined, assigneeId: me?._id },
    })).unwrap()

    if (lane.custom) setOverrides((cur) => ({ ...cur, [task._id]: lane.id }))
    await dispatch(fetchMyTasks()).unwrap()
  }

  const openComposer = (laneId = 'recent') => { setView('Board'); setComposerLane(laneId) }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch { setCopied(false) }
  }

  const toggle = (task: ITasks.Task) => toggleDone(task).catch(() => {})

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-white/10">
        <div className="flex h-14 items-center gap-2 px-0">
          <Avatar name={user?.displayName ?? user?.email ?? ''} size="h-8 w-8" className="text-xs ring-0" />
          <h1 className="ml-1 text-xl font-semibold text-white">My tasks</h1>
          <Dropdown width="w-60" trigger={({ open, toggle: t }) => (
            <button type="button" aria-expanded={open} onClick={t} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><ChevronDown className="h-4 w-4" /></button>
          )}>
            <div className="px-3 py-2 text-sm text-slate-300">{activeWorkspace?.name ?? 'My workspace'}</div>
          </Dropdown>

          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={share} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-sm text-slate-100 transition-colors hover:bg-white/5">
              {copied ? <Check className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4 text-slate-400" />}{copied ? 'Copied' : 'Share'}
            </button>
            <span aria-hidden className="mx-1 h-6 border-l border-white/10" />
            <Dropdown width="w-56" align="right" trigger={({ open, toggle: t }) => (
              <button type="button" aria-expanded={open} onClick={t} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-sm text-slate-100 transition-colors hover:bg-white/5">
                <Grid2X2 className="h-4 w-4 text-slate-400" />Customize
              </button>
            )}>
              <div className="py-1">
                <button type="button" onClick={() => setShowProjects((v) => !v)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"><Box on={showProjects} />Show project name</button>
                <button type="button" onClick={() => setShowDueDates((v) => !v)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"><Box on={showDueDates} />Show due date</button>
              </div>
            </Dropdown>
          </div>
        </div>

        <nav aria-label="My tasks views" className="flex h-11 items-center gap-1 overflow-x-auto px-0">
          {VIEWS.map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} className={`inline-flex h-8 shrink-0 items-center rounded-md px-3 text-sm font-semibold transition-colors ${view === v ? 'bg-blue-950 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>{v}</button>
          ))}
          {/* <Dropdown width="w-44" trigger={({ toggle: t }) => (
            <button type="button" title="Add view" onClick={t} className="ml-1 rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><Plus className="h-5 w-5" /></button>
          )}>
            <div className="px-3 py-2 text-sm text-slate-400">Saved views coming soon</div>
          </Dropdown> */}
        </nav>
      </header>

      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-0">
        <div className="inline-flex h-10 shrink-0 items-stretch rounded-md bg-blue-500 text-sm font-medium text-white sm:h-8 sm:rounded-md">
          <button type="button" onClick={() => openComposer('recent')} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-l-md px-2.5 hover:bg-blue-400 sm:px-3">
            <Plus className="h-4 w-4 shrink-0" /><span>Add task</span>
          </button>
          <Dropdown width="w-44" trigger={({ toggle: t }) => (
            <button type="button" aria-label="More add options" onClick={t} className="flex h-full shrink-0 items-center rounded-r-md border-l border-white/30 px-1.5 hover:bg-blue-400"><ChevronDown className="h-4 w-4" /></button>
          )}>
            {({ close }) => (
              <div className="py-1 text-slate-200">
                <button type="button" onClick={() => { close(); openComposer('recent') }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/5">Add task</button>
                <button type="button" onClick={() => { close(); setView('Board'); setAddingSection(true) }} className="w-full px-3 py-2 text-left text-sm hover:bg-white/5">Add section</button>
              </div>
            )}
          </Dropdown>
        </div>

        <div className="flex items-center gap-0.5">
          <ToolbarMenu label="Filter" Icon={ListFilter}>
            <div className="py-1">
              {[['all', 'All tasks'], ['upcoming', 'Upcoming'], ['overdue', 'Overdue'], ['completed', 'Completed']].map(([value, label]) => (
                <button key={value} type="button" onClick={() => { setFilter(value); if (value === 'completed') setHideCompleted(false) }} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 ${filter === value ? 'text-blue-300' : 'text-slate-200'}`}>{label}</button>
              ))}
            </div>
          </ToolbarMenu>
          <ToolbarMenu label="Sort" Icon={ArrowDownUp}>
            <div className="py-1">
              {[['due', 'Due date'], ['name', 'Task name']].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setSortMode(value)} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 ${sortMode === value ? 'text-blue-300' : 'text-slate-200'}`}>{label}</button>
              ))}
            </div>
          </ToolbarMenu>
          <ToolbarMenu label="Group" Icon={TableProperties}>
            <div className="px-3 py-2 text-sm text-slate-300">Grouped by due date</div>
          </ToolbarMenu>
          <ToolbarMenu label="Options" Icon={SlidersHorizontal}>
            <button type="button" onClick={() => setHideCompleted((v) => !v)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"><Box on={hideCompleted} />Hide completed tasks</button>
          </ToolbarMenu>
          <span className="mx-1 h-5 border-l border-white/10" />
          {searchOpen && <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks" className="h-8 w-44 rounded-md border border-white/15 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/30" />}
          <button type="button" aria-label="Search tasks" onClick={() => { setSearchOpen((v) => !v); setQuery('') }} className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"><Search className="h-[18px] w-[18px]" /></button>
        </div>
      </div>

      {taskError && (
        <div className="mx-0 mt-3 flex shrink-0 items-center justify-between rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {taskError}<button type="button" onClick={() => dispatch(clearTasksError())} className="underline">Dismiss</button>
        </div>
      )}

      {!loaded ? (
        <p className="px-0 py-8 text-sm text-slate-400">Loading tasks...</p>
      ) : view === 'Board' ? (
        <MyTasksBoard
          columns={columns}
          selectedTaskId={selectedTaskId}
          projects={projectEntities}
          showProjects={showProjects}
          showDueDates={showDueDates}
          today={today}
          addingSection={addingSection}
          setAddingSection={setAddingSection}
          composerLane={composerLane}
          setComposerLane={setComposerLane}
          editableProjects={editableProjects}
          defaultProjectId={defaultProjectId}
          onCreate={createInLane}
          onOpen={(task) => { setSelectedTaskId(task._id); setOpenedTask(task) }}
          onToggle={toggle}
          onMove={moveTask}
          onAdd={(column) => setComposerLane(column.id)}
          onAddColumn={addLane}
          onRemoveColumn={removeLane}
          onRenameColumn={(column, label) => column.custom
            ? setCustomLanes((current) => current.map((item) => item.id === column.id ? { ...item, label } : item))
            : setLaneNames((current) => ({ ...current, [column.id]: label }))}
          hideEmptyColumns={hideEmptyColumns}
          onToggleHideEmpty={() => setHideEmptyColumns((value) => !value)}
        />
      ) : view === 'List' ? (
        <div className="asana-scroll min-h-0 flex-1 overflow-auto px-0 py-2">
          <div className="min-w-[1050px]">
            <div className="grid grid-cols-[minmax(320px,1fr)_180px_190px_220px_160px] border-b border-white/10 py-2.5 text-sm text-slate-400">
              <span>Name</span><span>Due date</span><span>Collaborators</span><span>Projects</span><span>Task visibility</span>
            </div>
            {columns.map((column) => {
              const collapsed = Boolean(collapsedSections[column.id])
              return (
                <section key={column.id}>
                  <button type="button" aria-expanded={!collapsed} onClick={() => setCollapsedSections((current) => ({ ...current, [column.id]: !current[column.id] }))} className="flex h-[58px] w-full items-center gap-3 border-b border-white/10 px-3 text-left hover:bg-white/[0.03]">
                    {collapsed ? <ChevronRight className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    <span className="font-semibold text-slate-100">{column.label}</span>
                    <span className="text-sm text-slate-400">{column.tasks.length}</span>
                  </button>
                  {!collapsed && <>
                    {column.tasks.map((task) => {
                      const project = projectEntities[task.projectId]
                      const collaborator = projects.find((item) => item._id === task.projectId)?.members?.find((member) => member._id === task.assigneeId)
                      return (
                        <div key={task._id} onClick={() => { setSelectedTaskId(task._id); setOpenedTask(task) }} aria-selected={selectedTaskId === task._id} className={`grid min-h-[54px] cursor-pointer grid-cols-[minmax(320px,1fr)_180px_190px_220px_160px] items-center border-b border-white/10 ${selectedTaskId === task._id ? 'bg-blue-500/10 ring-1 ring-inset ring-blue-400/50' : 'hover:bg-white/[0.04]'}`}>
                          <span className="flex min-w-0 items-center gap-3 pl-9 pr-4"><TaskCheck done={task.status === 'done'} disabled={false} onToggle={() => toggle(task)} /><span className={`truncate text-sm ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{task.title}</span></span>
                          <span className={`text-sm ${isOverdue(task) ? 'text-red-400' : 'text-slate-400'}`}>{formatDate(task.dueDate)}</span>
                          <span className="flex items-center gap-2 text-sm text-slate-300">{collaborator && <Avatar name={collaborator.name ?? collaborator.email ?? ''} className="h-7 w-7 text-[10px]" />}{collaborator?.name ?? ''}</span>
                          <span className="min-w-0 pr-3">{project && <span className="inline-flex max-w-full items-center gap-1.5 rounded bg-white/10 py-0.5 pl-1 pr-2 text-sm text-slate-100"><span className="h-4 w-4 shrink-0 rounded-sm" style={{ backgroundColor: project.color || '#e879f9' }} /><span className="truncate">{project.name}</span></span>}</span>
                          <span className="flex items-center gap-2 text-sm text-slate-400"><Building2 className="h-4 w-4 shrink-0" />{activeWorkspace?.name ?? 'My workspace'}</span>
                        </div>
                      )
                    })}
                    <button type="button" onClick={() => openComposer(column.id)} className="flex h-[48px] w-full items-center gap-3 border-b border-white/10 pl-9 text-sm text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-100"><Plus className="h-4 w-4" />Add task</button>
                  </>}
                </section>
              )
            })}
            {!columns.some((column) => column.tasks.length) && <div className="py-16 text-center text-sm text-slate-400">No tasks match this view.</div>}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-0 text-center text-sm text-slate-400">{view} view is coming soon.</div>
      )}

      {openedTask && (
        <TaskPanel
          key={openedTask._id}
          taskId={openedTask._id}
          projectId={openedTask.projectId}
          role={projects.find((p) => p._id === openedTask.projectId)?.role}
          onClose={() => setOpenedTask(null)}
        />
      )}
    </div>
  )
}
