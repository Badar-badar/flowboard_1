import { useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { CalendarDays, Check, ChevronDown, ChevronRight, Columns3, EyeOff, FileText, MoreHorizontal, Pencil, Plus, ThumbsUp, Trash2 } from 'lucide-react'
import Dropdown from '../../../components/ui/dropdown'
import TaskCheck from './task-check'
import { useTasks } from '../hooks/use-tasks'
import { useProjects } from '../../projects/hooks/use-projects'
import { addDaysToDateInput, formatDate, getTaskDueSection, isOverdue, TASK_DUE_SECTIONS, toDateInput } from '../task-constants'
import { canEditTasks } from '../task-permissions'
import { useWorkspace } from '../../workspace/hooks/use-workspace'
import type { ITasks } from '../types/tasks.types'
import type { IProjects } from '../../projects/types/projects.types'
import type { DragEndEvent } from '@dnd-kit/core'
import type { ReactNode } from 'react'

const COL = 'w-[304px]'
type DueSectionId = 'recent' | 'today' | 'week' | 'later' | 'overdue'
interface Lane { id: string; label: string; custom?: boolean; defaultDue?: string; tasks: ITasks.Task[]; taskCount?: number }
type ProjectMap = Record<string, IProjects.Project | undefined>

function readWorkspaceSetting<T>(workspaceId: string | null | undefined, key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(`my-tasks:${key}:${workspaceId ?? 'none'}`)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function CardContent({ task, project, showProject, showDue, today, onToggle }: { task: ITasks.Task; project?: IProjects.Project; showProject: boolean; showDue: boolean; today: string; onToggle: () => void }) {
  const due = task.dueDate ? toDateInput(task.dueDate) : ''
  const dueColor = isOverdue(task) ? 'text-red-400' : due === today ? 'text-green-400' : 'text-slate-400'
  const done = task.status === 'done'

  return (
    <>
      <div className="flex items-start gap-2">
        <TaskCheck done={done} disabled={false} onToggle={onToggle} />
        <p className={`min-w-0 flex-1 break-words pr-4 text-sm leading-5 ${done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
          {task.title}
        </p>
      </div>

      {!!task.attachments?.length && <div className="mt-3 space-y-2">
        {task.attachments.slice(0, 3).map((attachment) => (
          <a
            key={attachment._id}
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            title={attachment.fileName}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            className="block overflow-hidden rounded-md border border-white/10 bg-black/15 hover:border-white/20"
          >
            {attachment.mimeType?.startsWith('image/')
              ? <img src={attachment.url} alt={attachment.fileName} className="block h-28 w-full object-cover" />
              : <span className="flex h-14 items-center justify-center bg-white/5"><FileText className="h-5 w-5 text-slate-400" /></span>}
          </a>
        ))}
        {task.attachments.length > 3 && <span className="text-xs text-slate-400">+{task.attachments.length - 3} more</span>}
      </div>}

      {showProject && project && (
        <span className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded bg-white/10 py-0.5 pl-1 pr-2 text-xs text-slate-100">
          <span className="h-3.5 w-3.5 shrink-0 rounded-sm" style={{ backgroundColor: project.color || '#e879f9' }} />
          <span className="truncate">{project.name}</span>
        </span>
      )}

      <div className="mt-3 flex h-6 items-center justify-between">
        {showDue && task.dueDate ? (
          <span className={`text-xs ${dueColor}`}>
            {formatDate(task.dueDate)}{due === today ? ' – Today' : ''}
          </span>
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-slate-500 text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" />
          </span>
        )}
        <ThumbsUp className="h-3.5 w-3.5 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </>
  )
}

function Card({ task, project, showProject, showDue, today, onOpen, onToggle, active = false }: { task: ITasks.Task; project?: IProjects.Project; showProject: boolean; showDue: boolean; today: string; onOpen: (task: ITasks.Task) => void; onToggle: (task: ITasks.Task) => void; active?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task._id })

  return (
    <article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      aria-selected={active}
      className={`group relative cursor-pointer rounded-lg border p-3 outline-none transition-colors ${active ? 'border-blue-400/70 bg-[#30343a] ring-1 ring-blue-400/40' : 'border-white/10 bg-[#2a2b2d] hover:border-white/25 hover:bg-[#303133]'} focus-visible:border-blue-400 ${isDragging ? 'opacity-40' : ''}`}
    >
      <div
        className="absolute right-1.5 top-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <Dropdown
          width="w-44"
          align="right"
          trigger={({ toggle }) => (
            <button type="button" aria-label="Task options" onClick={toggle} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        >
          {({ close }) => (
            <div className="py-1">
              <button type="button" onClick={() => { close(); onOpen(task) }} className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5">Open task details</button>
              <button type="button" onClick={() => { close(); onToggle(task) }} className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5">
                {task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
              </button>
            </div>
          )}
        </Dropdown>
      </div>
      <CardContent task={task} project={project} showProject={showProject} showDue={showDue} today={today} onToggle={() => onToggle(task)} />
    </article>
  )
}

// Inline "new task" card, like Asana: Enter creates and keeps a fresh card open, Esc closes
function InlineTaskCard({ column, projects, defaultProjectId, onCreate, onClose }: { column: Lane; projects: IProjects.Project[]; defaultProjectId?: string; onCreate: (column: Lane, title: string, projectId: string, dueDate: string) => Promise<unknown>; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?._id || '')
  const [due, setDue] = useState(column.defaultDue ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const input = useRef<HTMLTextAreaElement>(null)

  const submit = async () => {
    const value = title.trim()
    if (value.length < 2 || !projectId || busy) return
    setBusy(true)
    setError('')
    try {
      await onCreate(column, value, projectId, due)
      setTitle('')
      setDue(column.defaultDue ?? '')
      setTimeout(() => input.current?.focus(), 0)
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Could not create task')
    }
    setBusy(false)
  }

  return (
    <div
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node) && !title.trim()) onClose()
      }}
      className="rounded-lg border border-white/40 bg-[#2a2b2d] p-3"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-500 text-slate-500">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
        <textarea
          ref={input}
          autoFocus
          rows={1}
          value={title}
          disabled={busy}
          maxLength={120}
          placeholder="Write a task name"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); submit() }
            if (e.key === 'Escape') onClose()
          }}
          className="min-h-[20px] flex-1 resize-none bg-transparent text-sm leading-5 text-slate-100 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label className="relative flex h-6 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-slate-500 px-1.5 text-slate-400 hover:bg-white/5" title="Set due date">
          <CalendarDays className="h-3.5 w-3.5" />
          {due && <span className="pr-1 text-xs text-slate-200">{formatDate(due)}</span>}
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            aria-label="Due date"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>

        <label className="relative ml-auto flex max-w-[150px] items-center gap-1 rounded bg-white/10 py-0.5 pl-1.5 pr-1 text-xs text-slate-100 hover:bg-white/15">
          <span className="truncate">{projects.find((p) => p._id === projectId)?.name ?? 'Project'}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            aria-label="Project"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          >
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      {!projects.length && <p className="mt-2 text-xs text-slate-400">You have no project where you can add tasks.</p>}
    </div>
  )
}

function Column({ column, composing, composer, children, onAdd, onRemove, onRename, onAddSection, hideEmptyColumns, onToggleHideEmpty, allCollapsed, onToggleAllCollapsed }: { column: Lane; composing: boolean; composer: ReactNode; children: ReactNode; onAdd: (column: Lane) => void; onRemove: (column: Lane) => void; onRename: (column: Lane, title: string) => void; onAddSection: () => void; hideEmptyColumns: boolean; onToggleHideEmpty: () => void; allCollapsed: boolean; onToggleAllCollapsed: (collapsed: boolean) => void }) {
  // the whole column is the drop target, so empty columns are easy to hit
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const collapsed = allCollapsed
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(column.label)
  const commitName = () => {
    const next = name.trim()
    if (next) onRename(column, next)
    else setName(column.label)
    setEditingName(false)
  }

  return (
    <section ref={setNodeRef} className={`flex ${collapsed ? 'w-12' : COL} shrink-0 flex-col transition-[width]`}>
      <header className="group/h flex h-12 shrink-0 items-center gap-2 rounded-lg bg-[#252628] px-4">
        {collapsed ? (
          <button type="button" title={`Expand ${column.label}`} onClick={() => onToggleAllCollapsed(false)} className="flex min-w-0 flex-1 flex-col items-center gap-2 text-slate-300">
            <ChevronRight className="h-4 w-4" /><span className="text-xs">{column.tasks.length}</span>
          </button>
        ) : editingName ? (
          <input autoFocus value={name} maxLength={40} onChange={(event) => setName(event.target.value)} onBlur={commitName} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') { setName(column.label); setEditingName(false) } }} aria-label="Section name" className="min-w-0 flex-1 rounded bg-transparent px-1 text-base font-semibold text-white outline-none ring-1 ring-white/30" />
        ) : <>
          <h2 className="truncate text-base font-semibold text-slate-100">{column.label}</h2>
          <span className="text-sm text-slate-400">{column.tasks.length}</span>
        </>}
        {!collapsed && <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/h:opacity-100">
          <button type="button" aria-label="Add task" onClick={() => onAdd(column)} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white">
            <Plus className="h-4 w-4" />
          </button>
          <Dropdown width="w-64" align="right" trigger={({ toggle }) => (
            <button type="button" aria-label="Section options" onClick={toggle} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
          )}>
            {({ close }) => <div className="py-1 text-slate-200">
              <button type="button" onClick={() => { close(); setName(column.label); setEditingName(true) }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-white/5"><Pencil className="h-4 w-4 text-slate-400" />Rename section</button>
              <button type="button" onClick={() => { close(); onAddSection() }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-white/5"><Columns3 className="h-4 w-4 text-slate-400" />Add section<ChevronRight className="ml-auto h-4 w-4 text-slate-500" /></button>
              <button type="button" onClick={() => { close(); onToggleAllCollapsed(!allCollapsed) }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-white/5"><Columns3 className="h-4 w-4 text-slate-400" />{allCollapsed ? 'Expand all columns' : 'Collapse all columns'}<ChevronRight className="ml-auto h-4 w-4 text-slate-500" /></button>
              <button type="button" onClick={() => { close(); onToggleHideEmpty() }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-white/5"><EyeOff className="h-4 w-4 text-slate-400" />{hideEmptyColumns ? 'Show empty columns' : 'Hide all empty columns'}</button>
              <div className="my-1 border-t border-white/10" />
              <button type="button" disabled={(column.taskCount ?? column.tasks.length) > 0} onClick={() => { close(); onRemove(column) }} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-rose-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:text-slate-600"><Trash2 className="h-4 w-4" />Delete section</button>
            </div>}
          </Dropdown>
        </div>}
      </header>

      {/* as tall as its cards; scrolls vertically once it reaches the bottom of the screen */}
      {!collapsed && <div className={`asana-scroll mt-2 min-h-0 overflow-y-auto rounded-lg p-2 transition-colors ${isOver ? 'bg-[#2c2f35] ring-2 ring-blue-400/50' : 'bg-[#252628]'}`}>
        <div className="space-y-2">{children}</div>
        {composing && <div className="mt-2">{composer}</div>}
        <button
          type="button"
          onClick={() => onAdd(column)}
          className="mt-2 flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100"
        >
          <Plus className="h-4 w-4" /> Add task
        </button>
      </div>}
    </section>
  )
}

export function MyTasksBoard({
  columns, projects, showProjects, showDueDates, today,
  selectedTaskId,
  addingSection, setAddingSection,
  composerLane, setComposerLane, editableProjects, defaultProjectId, onCreate,
  onOpen, onToggle, onMove, onAdd, onAddColumn, onRemoveColumn, onRenameColumn,
  hideEmptyColumns, onToggleHideEmpty,
}: {
  columns: Lane[]; projects: ProjectMap; showProjects: boolean; showDueDates: boolean; today: string;
  selectedTaskId: string | null; addingSection: boolean; setAddingSection: (value: boolean) => void;
  composerLane: string | null; setComposerLane: (value: string | null) => void;
  editableProjects: IProjects.Project[]; defaultProjectId?: string;
  onCreate: (column: Lane, title: string, projectId: string, dueDate: string) => Promise<unknown>;
  onOpen: (task: ITasks.Task) => void; onToggle: (task: ITasks.Task) => void;
  onMove: (task: ITasks.Task, column: Lane) => void; onAdd: (column: Lane) => void;
  onAddColumn: (label: string) => void; onRemoveColumn: (column: Lane) => void;
  onRenameColumn: (column: Lane, label: string) => void; hideEmptyColumns: boolean;
  onToggleHideEmpty: () => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [collapseAll, setCollapseAll] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const scrollAfterAdd = useRef(false)

  useEffect(() => {
    if (addingSection) boardRef.current?.scrollTo({ left: boardRef.current.scrollWidth, behavior: 'smooth' })
  }, [addingSection])

  useEffect(() => {
    if (!scrollAfterAdd.current) return
    scrollAfterAdd.current = false
    boardRef.current?.scrollTo({ left: boardRef.current.scrollWidth, behavior: 'smooth' })
  }, [columns.length])
  // a few pixels of movement starts a drag; a plain click still opens the task
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const allTasks = columns.flatMap((c) => c.tasks)
  const activeTask = allTasks.find((t) => t._id === activeId)

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) return
    const task = allTasks.find((t) => t._id === active.id)
    const column = columns.find((c) => c.id === over.id)
    if (task && column) onMove(task, column)
  }

  const submitSection = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const label = name.trim()
    if (!label) return
    onAddColumn(label)
    setName('')
    setAddingSection(false)
    setCollapseAll(false)
    scrollAfterAdd.current = true
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div ref={boardRef} className="asana-scroll flex min-h-0 flex-1 items-stretch gap-4 overflow-x-auto overflow-y-hidden px-6 pb-4 pt-4 [--scroll-bg:#1e1f21]">
        {columns.filter((column) => !hideEmptyColumns || column.tasks.length > 0 || composerLane === column.id).map((column) => (
          <Column
            key={column.id}
            column={column}
            onAdd={onAdd}
            onRemove={onRemoveColumn}
            onRename={onRenameColumn}
            onAddSection={() => setAddingSection(true)}
            hideEmptyColumns={hideEmptyColumns}
            onToggleHideEmpty={onToggleHideEmpty}
            allCollapsed={collapseAll}
            onToggleAllCollapsed={setCollapseAll}
            composing={composerLane === column.id}
            composer={
              <InlineTaskCard
                column={column}
                projects={editableProjects}
                defaultProjectId={defaultProjectId}
                onCreate={onCreate}
                onClose={() => setComposerLane(null)}
              />
            }
          >
            {column.tasks.map((task) => (
              <Card
                key={task._id}
                task={task}
                project={projects[task.projectId]}
                showProject={showProjects}
                showDue={showDueDates}
                today={today}
                onOpen={onOpen}
                onToggle={onToggle}
                active={selectedTaskId === task._id}
              />
            ))}
          </Column>
        ))}

        <div className={`${COL} shrink-0`}>
          {addingSection ? (
            <form onSubmit={submitSection} className="rounded-lg bg-[#252628] p-2">
              <input
                autoFocus
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setAddingSection(false); setName('') } }}
                onBlur={() => { if (!name.trim()) setAddingSection(false) }}
                placeholder="Section name"
                className="h-9 w-full rounded-md border border-white/20 bg-[#2a2b2d] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/50"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingSection(true)}
              className="flex h-12 w-full items-center gap-2 rounded-lg px-4 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100"
            >
              <Plus className="h-4 w-4" /> Add section
            </button>
          )}
        </div>
        <div className="w-2 shrink-0" />
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="w-[288px] rotate-[1.5deg] cursor-grabbing rounded-lg border border-white/25 bg-[#303133] p-3 shadow-2xl">
            <CardContent
              task={activeTask}
              project={projects[activeTask.projectId]}
              showProject={showProjects}
              showDue={showDueDates}
              today={today}
              onToggle={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function ProjectColumn({ section, tasks, project, role, onOpen, onToggle, onAdd, composing, onCreate, activeTaskId }: { section: Lane; tasks: ITasks.Task[]; project?: IProjects.Project; role?: string; onOpen: (task: ITasks.Task) => void; onToggle: (task: ITasks.Task) => void; onAdd: (sectionId: string | null) => void; composing: boolean; onCreate: (column: Lane, title: string, projectId: string, dueDate: string) => Promise<unknown>; activeTaskId: string | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: section.id })
  const canAdd = canEditTasks(role)
  const column = { ...section, tasks }

  return (
    <section ref={setNodeRef} className={`${COL} flex shrink-0 flex-col`}>
      <header className="flex h-12 shrink-0 items-center gap-2 rounded-lg bg-[#252628] px-4">
        <h2 className="truncate text-base font-semibold text-slate-100">{section.label}</h2>
        <span className="text-sm text-slate-400">{tasks.length}</span>
        {canAdd && <button type="button" aria-label={`Add task to ${section.label}`} onClick={() => onAdd(section.id)} className="ml-auto rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><Plus className="h-4 w-4" /></button>}
      </header>
      <div className={`asana-scroll mt-2 min-h-0 flex-1 overflow-y-auto rounded-lg p-2 ${isOver ? 'bg-[#2c2f35] ring-2 ring-blue-400/50' : 'bg-[#252628]'}`}>
        <div className="space-y-2">
          {tasks.map((task) => <Card key={task._id} task={task} project={project} showProject={false} showDue today={toDateInput(new Date())} onOpen={onOpen} onToggle={onToggle} active={task._id === activeTaskId} />)}
          {composing && <InlineTaskCard column={column} projects={project ? [project] : []} defaultProjectId={project?._id} onCreate={onCreate} onClose={() => onAdd(null)} />}
          {canAdd && <button type="button" onClick={() => onAdd(section.id)} className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-100"><Plus className="h-4 w-4" />Add task</button>}
        </div>
      </div>
    </section>
  )
}

export default function TaskBoardView({ projectId, role, onOpen }: { projectId: string; role?: string; onOpen: (taskId: string) => void }) {
  const { tasks, loaded, error, clearError, addTask, editTask } = useTasks(projectId)
  const { projects } = useProjects()
  const { activeId: workspaceId } = useWorkspace()
  const project = projects.find((item) => item._id === projectId)
  const [composerStatus, setComposerStatus] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [customLanes, setCustomLanes] = useState<Array<{ id: string; label: string }>>(() => readWorkspaceSetting(workspaceId, 'lanes', []))
  const [laneOverrides, setLaneOverrides] = useState<Record<string, string>>(() => readWorkspaceSetting(workspaceId, 'overrides', {}))
  const [laneNames, setLaneNames] = useState<Record<string, string>>(() => readWorkspaceSetting(workspaceId, 'lane-names', {}))
  const [deletedLanes, setDeletedLanes] = useState<string[]>(() => readWorkspaceSetting(workspaceId, 'deleted-lanes', []))
  const [hideEmptyColumns, setHideEmptyColumns] = useState(() => readWorkspaceSetting(workspaceId, 'hide-empty', false))
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  useEffect(() => {
    setCustomLanes(readWorkspaceSetting(workspaceId, 'lanes', []))
    setLaneOverrides(readWorkspaceSetting(workspaceId, 'overrides', {}))
    setLaneNames(readWorkspaceSetting(workspaceId, 'lane-names', {}))
    setDeletedLanes(readWorkspaceSetting(workspaceId, 'deleted-lanes', []))
    setHideEmptyColumns(readWorkspaceSetting(workspaceId, 'hide-empty', false))
  }, [workspaceId])
  const today = toDateInput(new Date())
  const sections = useMemo(() => [
    ...TASK_DUE_SECTIONS.map((section) => ({ ...section, label: laneNames[section.id] ?? section.label, custom: false })),
    ...customLanes.map((section) => ({ ...section, custom: true })),
  ], [customLanes, laneNames])
  const sectionForTask = (task: ITasks.Task): string => {
    const override = laneOverrides[task._id]
    if (override && customLanes.some((section) => section.id === override)) return override
    return getTaskDueSection(task, today)
  }
  const columns = useMemo(() => sections.map((section) => {
    const sectionTasks = tasks.filter((task) => sectionForTask(task) === section.id)
    return {
      ...section,
      defaultDue: section.custom ? undefined : ({ week: addDaysToDateInput(today, 3), later: addDaysToDateInput(today, 14), overdue: addDaysToDateInput(today, -1) })[section.id],
      tasks: sectionTasks,
    }
  }).filter((section) => (!deletedLanes.includes(section.id) || section.tasks.length > 0) && (!hideEmptyColumns || section.tasks.length > 0)), [sections, tasks, laneOverrides, customLanes, today, deletedLanes, hideEmptyColumns])
  const activeTask = tasks.find((task) => task._id === activeId)

  const createInColumn = async (column: Lane, title: string, _projectId: string, dueDate: string) => {
    const task = await addTask({ title, status: 'todo', dueDate: dueDate || undefined })
    if (column.custom) {
      setLaneOverrides((current) => {
        const next = { ...current, [task._id]: column.id }
        localStorage.setItem(`my-tasks:overrides:${workspaceId}`, JSON.stringify(next))
        return next
      })
    }
  }
  const toggleTask = (task: ITasks.Task) => editTask(task._id, { status: task.status === 'done' ? 'todo' : 'done' }).catch(() => {})
  const moveTask = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) return
    const task = tasks.find((item) => item._id === String(active.id))
    const section = columns.find((item) => item.id === String(over.id))
    if (!task || !section || sectionForTask(task) === section.id) return
    if (section.custom) {
      setLaneOverrides((current) => {
        const next = { ...current, [task._id]: section.id }
        localStorage.setItem(`my-tasks:overrides:${workspaceId}`, JSON.stringify(next))
        return next
      })
      return
    }
    setLaneOverrides((current) => {
      const next = { ...current }
      delete next[task._id]
      localStorage.setItem(`my-tasks:overrides:${workspaceId}`, JSON.stringify(next))
      return next
    })
    const dueDates: Record<DueSectionId, string | null> = { recent: null, today, week: addDaysToDateInput(today, 3), later: addDaysToDateInput(today, 14), overdue: addDaysToDateInput(today, -1) }
    const dueDate = dueDates[section.id as DueSectionId]
    editTask(task._id, { dueDate }).catch(() => {})
  }

  if (!loaded) return <p className="py-10 text-sm text-slate-400">Loading tasks...</p>

  return (
    <div className="project-board-height flex h-[calc(100dvh-14rem)] min-h-[20rem] flex-col">
      {error && <div className="mb-2 flex items-center justify-between rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}<button type="button" onClick={clearError} className="underline">Dismiss</button></div>}
      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={({ active }) => setActiveId(String(active.id))} onDragEnd={moveTask} onDragCancel={() => setActiveId(null)}>
        <div className="asana-scroll flex min-h-0 flex-1 items-stretch gap-4 overflow-x-auto overflow-y-hidden pb-3 pt-2">
          {columns.map((column) => <ProjectColumn key={column.id} section={column} tasks={column.tasks} project={project} role={role} onOpen={(task) => { setSelectedTaskId(task._id); onOpen(task._id) }} onToggle={toggleTask} onAdd={setComposerStatus} composing={composerStatus === column.id} onCreate={createInColumn} activeTaskId={selectedTaskId} />)}
        </div>
        <DragOverlay>{activeTask && <div className="w-[288px] rounded-lg border border-white/25 bg-[#303133] p-3 shadow-2xl"><CardContent task={activeTask} project={project} showProject={false} showDue today={toDateInput(new Date())} onToggle={() => {}} /></div>}</DragOverlay>
      </DndContext>
    </div>
  )
}
