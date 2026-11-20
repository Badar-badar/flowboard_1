import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownUp, ChevronDown, ListFilter, MoreHorizontal, Plus, Search, SlidersHorizontal, TableProperties } from 'lucide-react'
import Dropdown from '../../../components/ui/dropdown'
import TaskRow, { ROW_GRID } from './task-row'
import AddTaskRow from './add-task-row'
import { useTasks } from '../hooks/use-tasks'
import { useProjectMembers } from '../../members/hooks/use-project-members'
import { useWorkspace } from '../../workspace/hooks/use-workspace'
import { getTaskDueSection, TASK_DUE_SECTIONS, TASK_STATUSES, toDateInput } from '../task-constants'
import { canEditTasks } from '../task-permissions'

function ToolbarMenu({ label, Icon, width = 'w-48', children }) {
  return (
    <Dropdown width={width} align="right" trigger={({ open, toggle }) => (
      <button type="button" aria-expanded={open} onClick={toggle} className="inline-flex h-8 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
        <Icon className="h-4 w-4 text-slate-400" />{label}
      </button>
    )}>
      {children}
    </Dropdown>
  )
}

function readWorkspaceSetting(workspaceId, key, fallback) {
  try {
    const value = localStorage.getItem(`my-tasks:${key}:${workspaceId ?? 'none'}`)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export default function TaskListView({ projectId, role, onOpen }) {
  const { tasks, loaded, error, clearError, addTask, editTask, removeTask } = useTasks(projectId)
  const { members, meId } = useProjectMembers(projectId)
  const { activeId: workspaceId } = useWorkspace()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [sections, setSections] = useState([
    { id: 'section-default-1', name: 'Untitled section' },
    { id: 'section-default-2', name: 'Untitled section' },
  ])
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [sectionDraft, setSectionDraft] = useState('')
  const sectionEditCommitted = useRef(false)
  const [sectionQuickAddId, setSectionQuickAddId] = useState<string | null>(null)
  const [sectionTasks, setSectionTasks] = useState<Record<string, string[]>>({})
  const [groupMode, setGroupMode] = useState('custom')
  const [customLanes, setCustomLanes] = useState(() => readWorkspaceSetting(workspaceId, 'lanes', []))
  const [laneOverrides, setLaneOverrides] = useState(() => readWorkspaceSetting(workspaceId, 'overrides', {}))
  const [laneNames, setLaneNames] = useState(() => readWorkspaceSetting(workspaceId, 'lane-names', {}))
  const [deletedLanes, setDeletedLanes] = useState(() => readWorkspaceSetting(workspaceId, 'deleted-lanes', []))
  const [hideEmptyColumns, setHideEmptyColumns] = useState(() => readWorkspaceSetting(workspaceId, 'hide-empty', false))
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortMode, setSortMode] = useState('created')
  const [hideCompleted, setHideCompleted] = useState(false)
  const canAdd = canEditTasks(role)

  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks
      .filter((task) => (!q || task.title.toLowerCase().includes(q)))
      .filter((task) => statusFilter === 'all' || task.status === statusFilter)
      .filter((task) => !hideCompleted || task.status !== 'done')
      .sort((a, b) => sortMode === 'name'
        ? a.title.localeCompare(b.title)
        : sortMode === 'due' ? (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') : 0)
  }, [tasks, query, statusFilter, sortMode, hideCompleted])

  const groups = useMemo(
    () => TASK_STATUSES.map((status) => ({ ...status, items: visibleTasks.filter((task) => task.status === status.value) })),
    [visibleTasks],
  )
  const today = toDateInput(new Date())
  useEffect(() => {
    setCustomLanes(readWorkspaceSetting(workspaceId, 'lanes', []))
    setLaneOverrides(readWorkspaceSetting(workspaceId, 'overrides', {}))
    setLaneNames(readWorkspaceSetting(workspaceId, 'lane-names', {}))
    setDeletedLanes(readWorkspaceSetting(workspaceId, 'deleted-lanes', []))
    setHideEmptyColumns(readWorkspaceSetting(workspaceId, 'hide-empty', false))
  }, [workspaceId])
  const dueSections = useMemo(() => [
    ...TASK_DUE_SECTIONS.map((section) => ({ ...section, label: laneNames[section.id] ?? section.label, custom: false })),
    ...customLanes.map((section) => ({ ...section, custom: true })),
  ], [customLanes, laneNames])
  const taskSection = (task) => {
    const override = laneOverrides[task._id]
    if (override && customLanes.some((section) => section.id === override)) return override
    return getTaskDueSection(task, today)
  }
  const dueGroups = useMemo(
    () => dueSections.map((section) => ({
      ...section,
      items: visibleTasks.filter((task) => taskSection(task) === section.id),
      taskCount: tasks.filter((task) => taskSection(task) === section.id).length,
    })).filter((section) => (!deletedLanes.includes(section.id) || section.taskCount > 0) && (!hideEmptyColumns || section.taskCount > 0)),
    [dueSections, visibleTasks, tasks, today, laneOverrides, customLanes, deletedLanes, hideEmptyColumns],
  )
  const sectionTaskIds = new Set<string>(Object.values(sectionTasks).flat())
  const unsectionedTasks = visibleTasks.filter((task) => !sectionTaskIds.has(task._id))

  const onEdit = (id, changes) => editTask(id, changes).catch(() => {})
  const onDelete = async (task) => {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return
    try { await removeTask(task._id) } catch { /* the task error banner shows the failure */ }
  }

  const addSectionTask = async (sectionId, title, dueDate) => {
    const task = await addTask({ title, status: 'todo', dueDate })
    setSectionTasks((current) => ({ ...current, [sectionId]: [...(current[sectionId] ?? []), task._id] }))
  }

  const saveSection = (sectionId) => {
    if (editingSectionId !== sectionId || sectionEditCommitted.current) return
    sectionEditCommitted.current = true
    const name = sectionDraft.trim() || 'Untitled section'
    setSections((current) => current.map((section) => section.id === sectionId ? { ...section, name } : section))
    setEditingSectionId(null)
    setSectionDraft('')
  }

  const cancelSectionEdit = () => {
    sectionEditCommitted.current = true
    setEditingSectionId(null)
    setSectionDraft('')
  }

  if (!loaded) return <p className="py-10 text-slate-400">Loading tasks...</p>

  return (
    <div className="min-w-0">
      {error && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}<button onClick={clearError} className="underline">Dismiss</button>
        </div>
      )}

      <div className="flex min-h-[66px] items-center justify-between gap-3 border-b border-white/10 px-3 py-3">
        {canAdd ? <AddTaskRow compact onAdd={(title, dueDate) => addTask({ title, status: 'todo', dueDate })} /> : <span />}
        <div className="flex items-center gap-1">
          <ToolbarMenu label="Filter" Icon={ListFilter}>
            <div className="py-1">
              {[['all', 'All tasks'], ...TASK_STATUSES.map((status) => [status.value, status.label])].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 ${statusFilter === value ? 'text-blue-300' : 'text-slate-200'}`}>{label}</button>
              ))}
            </div>
          </ToolbarMenu>
          <ToolbarMenu label="Sort" Icon={ArrowDownUp}>
            <div className="py-1">
              {[['created', 'Default order'], ['name', 'Task name'], ['due', 'Due date']].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setSortMode(value)} className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 ${sortMode === value ? 'text-blue-300' : 'text-slate-200'}`}>{label}</button>
              ))}
            </div>
          </ToolbarMenu>
          <ToolbarMenu label="Group" Icon={TableProperties}>
            <div className="py-1">
              {[["due", "Due date sections"], ["status", "Task status"], ["custom", "Custom sections"]].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setGroupMode(value)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5">
                  <span className={`h-4 w-4 rounded-full border ${groupMode === value ? 'border-blue-400 bg-blue-400' : 'border-white/30'}`} />{label}
                </button>
              ))}
            </div>
          </ToolbarMenu>
          <ToolbarMenu label="Options" Icon={SlidersHorizontal}>
            <button type="button" onClick={() => setHideCompleted((value) => !value)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5">
              <span className={`h-4 w-4 rounded border ${hideCompleted ? 'border-blue-400 bg-blue-400' : 'border-white/30'}`} />Hide completed tasks
            </button>
          </ToolbarMenu>
          <span className="mx-1 h-6 border-l border-white/10" />
          {searchOpen && (
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" className="h-9 w-44 rounded-md border border-white/15 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/30" />
          )}
          <button type="button" aria-label="Search tasks" onClick={() => { setSearchOpen((value) => !value); setQuery('') }} className="rounded-md p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"><Search className="h-5 w-5" /></button>
        </div>
      </div>

      <div className={`${ROW_GRID} border-b border-white/10 text-sm text-slate-400`}>
        <span className="px-1 py-3">Name</span>
        <span className="border-l border-white/10 px-3 py-3 max-sm:hidden">Assignee</span>
        <span className="border-l border-white/10 px-3 py-3 max-sm:hidden">Due date</span>
        <button type="button" title="Add field" className="flex h-full items-center justify-center border-l border-white/10 text-base text-slate-400 hover:bg-white/5 hover:text-white">+</button>
        <span className="max-sm:hidden" />
      </div>

      {groupMode === 'status' ? groups.map((group) => (
        <section key={group.value}>
          <button type="button" onClick={() => setCollapsed((current) => ({ ...current, [group.value]: !current[group.value] }))} className="flex min-h-9 w-full items-center gap-2 border-b border-white/10 px-3 text-left hover:bg-white/[0.025]">
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${collapsed[group.value] ? '-rotate-90' : ''}`} />
            <span className="text-base font-semibold text-slate-100">{group.label}</span>
            <span className="text-xs text-slate-500">{group.items.length}</span>
          </button>
          {!collapsed[group.value] && <>
            {group.items.map((task) => <TaskRow key={task._id} task={task} role={role} meId={meId} members={members} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />)}
            {canAdd && <AddTaskRow onAdd={(title, dueDate) => addTask({ title, status: group.value, dueDate })} />}
          </>}
        </section>
      )) : groupMode === 'due' ? dueGroups.map((group) => (
        <section key={group.id}>
          <button type="button" onClick={() => setCollapsed((current) => ({ ...current, [group.id]: !current[group.id] }))} className="flex min-h-9 w-full items-center gap-2 border-b border-white/10 px-3 text-left hover:bg-white/[0.025]">
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${collapsed[group.id] ? '-rotate-90' : ''}`} />
            <span className="text-base font-semibold text-slate-100">{group.label}</span>
            <span className="text-xs text-slate-500">{group.items.length}</span>
          </button>
          {!collapsed[group.id] && <>
            {group.items.map((task) => <TaskRow key={task._id} task={task} role={role} meId={meId} members={members} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />)}
            {canAdd && <AddTaskRow onAdd={(title, dueDate) => addTask({ title, status: 'todo', dueDate })} />}
          </>}
        </section>
      )) : (
        <>
          {unsectionedTasks.map((task) => <TaskRow key={task._id} task={task} role={role} meId={meId} members={members} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />)}
          {canAdd && <AddTaskRow onAdd={(title, dueDate) => addTask({ title, status: 'todo', dueDate })} />}
          {sections.map((section) => {
            const sectionItems = (sectionTasks[section.id] ?? []).flatMap((taskId) => {
              const task = visibleTasks.find((item) => item._id === taskId)
              return task ? [task] : []
            })
            return (
              <section key={section.id}>
                <div className="group flex min-h-11 items-center gap-1 border-b border-white/10 px-2 text-left transition-colors hover:bg-white/[0.025]">
                  <button type="button" aria-label={collapsed[section.id] ? 'Expand section' : 'Collapse section'} onClick={() => setCollapsed((current) => ({ ...current, [section.id]: !current[section.id] }))} className="flex h-8 w-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-white/10 hover:text-white">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${collapsed[section.id] ? '-rotate-90' : ''}`} />
                  </button>
                  {editingSectionId === section.id ? (
                    <input
                      autoFocus
                      value={sectionDraft}
                      onChange={(event) => setSectionDraft(event.target.value)}
                      onBlur={() => saveSection(section.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') { event.preventDefault(); saveSection(section.id) }
                        if (event.key === 'Escape') cancelSectionEdit()
                      }}
                      className="h-10 w-60 rounded-lg border-2 border-white bg-transparent px-3 text-lg font-semibold text-white outline-none"
                      aria-label="Section name"
                    />
                  ) : (
                    <button type="button" onClick={() => { sectionEditCommitted.current = false; setSectionDraft(section.name); setEditingSectionId(section.id) }} className="min-w-0 truncate rounded px-1 text-left text-base font-semibold text-slate-100 hover:bg-white/5">
                      {section.name}
                    </button>
                  )}
                  <div className={`ml-1 flex items-center gap-1 transition-opacity ${editingSectionId === section.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}`}>
                    <button
                      type="button"
                      title="Add task to section"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => { if (editingSectionId === section.id) saveSection(section.id); setSectionQuickAddId(section.id) }}
                      className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                    ><Plus className="h-4 w-4" /></button>
                    <Dropdown width="w-44" align="right" trigger={({ toggle }) => <button type="button" title="Section options" onMouseDown={(event) => event.preventDefault()} onClick={toggle} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>}>
                      {({ close }) => <div className="py-1">
                        <button type="button" onClick={() => { sectionEditCommitted.current = false; setSectionDraft(section.name); setEditingSectionId(section.id); close() }} className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5">Rename section</button>
                        <button type="button" onClick={() => { setSections((current) => current.filter((item) => item.id !== section.id)); close() }} className="w-full px-3 py-2 text-left text-sm text-rose-300 hover:bg-white/5">Delete section</button>
                      </div>}
                    </Dropdown>
                  </div>
                </div>
                {!collapsed[section.id] && <>
                  {sectionItems.map((task) => <TaskRow key={task._id} task={task} role={role} meId={meId} members={members} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />)}
                  {canAdd && <AddTaskRow autoOpen={sectionQuickAddId === section.id} onClose={() => setSectionQuickAddId(null)} onAdd={(title, dueDate) => addSectionTask(section.id, title, dueDate)} />}
                </>}
              </section>
            )
          })}
          {canAdd && <button type="button" onClick={() => setSections((current) => [...current, { id: `section-${Date.now()}`, name: 'Untitled section' }])} className="flex h-11 items-center gap-2 px-3 text-base font-medium text-slate-400 transition hover:bg-white/[0.035] hover:text-white"><Plus className="h-5 w-5" />Add section</button>}
        </>
      )}

      {!visibleTasks.length && (query || statusFilter !== 'all' || hideCompleted) && (
        <p className="py-7 text-center text-xs text-slate-500">No tasks match these filters.</p>
      )}
    </div>
  )
}
