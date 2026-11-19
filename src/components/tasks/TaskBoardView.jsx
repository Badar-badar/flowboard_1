import { useMemo, useRef, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { useTasks } from '../../features/tasks/useTasks'
import { useProjectMembers } from '../../features/members/useProjectMembers'
import { useSelector } from 'react-redux'
import { CalendarDays, Plus, ThumbsUp } from 'lucide-react'
import { projectsSelectors } from '../../features/projects/projectsSlice'
import TaskCheck from './TaskCheck'
import { TASK_STATUSES, formatDate, isOverdue, toDateInput } from '../../lib/taskConstants'
import { canChangeStatus, canEditTasks } from '../../lib/taskPermissions'
import AddTaskRow from './AddTaskRow'

function CardBody({ task, project, onToggle }) {
  const dueDate = toDateInput(task.dueDate)
  const today = toDateInput(new Date())

  return (
    <div className="min-h-[145px] rounded-xl border border-white/10 bg-[#2a2b2d] p-4">
      <div className="flex items-start gap-2">
        <TaskCheck done={task.status === 'done'} onToggle={onToggle} />
        <p className={`-mt-0.5 text-[15px] leading-6 ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
          {task.title}
        </p>
      </div>
      {project && (
        <div className="mt-5 inline-flex max-w-full items-center gap-1.5 rounded-md bg-[#3a3b3d] px-1.5 py-1">
          <span className="h-4 w-4 shrink-0 rounded" style={{ backgroundColor: project.color || '#e879f9' }} />
          <span className="truncate text-sm text-slate-100">{project.name}</span>
        </div>
      )}
      <div className="mt-5 flex items-center justify-between">
        {task.dueDate ? (
          <p className={`text-sm ${isOverdue(task) ? 'text-red-400' : 'text-green-400'}`}>
            {formatDate(task.dueDate)}{dueDate === today ? ' – Today' : ''}
          </p>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-500 text-slate-400">
            <CalendarDays className="h-4 w-4" />
          </span>
        )}
        <span aria-hidden="true" className="p-1 text-slate-500">
          <ThumbsUp className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}

function Card({ task, project, draggable, onOpen, onToggle }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task._id, disabled: !draggable })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task._id)}
      data-no-board-pan="true"
      className={`cursor-grab cursor-pointer active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}
    >
      <CardBody task={task} project={project} onToggle={onToggle} />
    </div>
  )
}

function Column({ status, children, count }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id })
  return (
    <section className="flex h-[calc(100dvh-14rem)] min-h-[20rem] w-[26rem] flex-none flex-col">
      <div className="mb-3 flex h-16 shrink-0 items-center gap-3 rounded-lg bg-[#252628] px-5">
        <h3 className="text-lg font-semibold text-slate-100">{status.label}</h3>
        <span className="text-sm text-slate-400">{count}</span>
      </div>
      <div
        ref={setNodeRef}
        style={{ scrollbarColor: '#56585b #252628', scrollbarWidth: 'thin' }}
        className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain rounded-lg p-3 transition-colors ${isOver ? 'bg-white/[0.06]' : 'bg-[#252628]'}`}
      >
        <div className="space-y-3">{children}</div>
      </div>
    </section>
  )
}

export default function TaskBoardView({ projectId, role, onOpen }) {
  const { tasks, loaded, error, clearError, addTask, editTask } = useTasks(projectId)
  const { meId } = useProjectMembers(projectId)
  const project = useSelector((state) => projectsSelectors.selectById(state, projectId))
  const [activeId, setActiveId] = useState(null)
  const [customColumns, setCustomColumns] = useState([])
  const [customAssignments, setCustomAssignments] = useState({})
  const [addingSection, setAddingSection] = useState(false)
  const [sectionName, setSectionName] = useState('')
  const boardRef = useRef(null)
  const panRef = useRef(null)
  const [isPanning, setIsPanning] = useState(false)
  // distance: a small movement starts a drag, a plain click still opens the panel
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const columns = useMemo(() => [
    ...TASK_STATUSES.map((status) => ({ ...status, id: status.value, kind: 'status' })),
    ...customColumns,
  ], [customColumns])
  const tasksByColumn = useMemo(() => Object.fromEntries(columns.map((column) => [
    column.id,
    tasks.filter((task) => {
      const assignedColumn = customAssignments[task._id]
      return column.kind === 'custom'
        ? assignedColumn === column.id
        : !assignedColumn && task.status === column.value
    }),
  ])), [columns, tasks, customAssignments])
  const activeTask = tasks.find((t) => t._id === activeId)

  const onDragEnd = ({ active, over }) => {
    setActiveId(null)
    const task = tasks.find((t) => t._id === active.id)
    if (!task || !over) return
    const target = columns.find((column) => column.id === over.id)
    if (!target) return

    if (target.kind === 'custom') {
      setCustomAssignments((current) => ({ ...current, [task._id]: target.id }))
      return
    }

    setCustomAssignments((current) => {
      const next = { ...current }
      delete next[task._id]
      return next
    })
    if (task.status !== target.value) editTask(task._id, { status: target.value }).catch(() => {})
  }

  const createSection = (event) => {
    event.preventDefault()
    const label = sectionName.trim()
    if (!label) return
    setCustomColumns((current) => [...current, {
      id: `custom-${Date.now()}`,
      value: 'todo',
      label,
      kind: 'custom',
      dot: 'bg-slate-400',
    }])
    setSectionName('')
    setAddingSection(false)
  }

  const startBoardPan = (event) => {
    if (event.button !== 0 || event.target.closest('[data-no-board-pan], button, input, a, select, textarea')) return
    const board = boardRef.current
    if (!board) return
    panRef.current = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: board.scrollLeft }
    board.setPointerCapture(event.pointerId)
    setIsPanning(true)
  }

  const moveBoardPan = (event) => {
    if (!panRef.current || !boardRef.current) return
    event.preventDefault()
    boardRef.current.scrollLeft = panRef.current.scrollLeft - (event.clientX - panRef.current.startX)
  }

  const stopBoardPan = (event) => {
    if (!panRef.current) return
    if (boardRef.current?.hasPointerCapture(event.pointerId)) boardRef.current.releasePointerCapture(event.pointerId)
    panRef.current = null
    setIsPanning(false)
  }

  if (!loaded) return <p className="py-10 text-slate-400">Loading tasks...</p>

  return (
    <div className="flex h-[calc(100dvh-14rem)] min-h-[20rem] flex-col overflow-hidden">
      {error && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
          <button onClick={clearError} className="underline">Dismiss</button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={(e) => setActiveId(e.active.id)} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div
          ref={boardRef}
          onPointerDown={startBoardPan}
          onPointerMove={moveBoardPan}
          onPointerUp={stopBoardPan}
          onPointerCancel={stopBoardPan}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-y' }}
          className={`flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden pb-3 pt-4 [&::-webkit-scrollbar]:hidden ${isPanning ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        >
          {columns.map((column) => (
            <Column key={column.id} status={column} count={tasksByColumn[column.id].length}>
              {tasksByColumn[column.id].map((t) => (
                <Card
                  key={t._id}
                  task={t}
                  project={project}
                  draggable={canChangeStatus(role, t, meId)}
                  onOpen={onOpen}
                  onToggle={() => editTask(t._id, { status: t.status === 'done' ? 'todo' : 'done' }).catch(() => {})}
                />
              ))}
              {canEditTasks(role) && (
                <AddTaskRow
                  onAdd={async (title, dueDate) => {
                    const created = await addTask({ title, status: column.value, dueDate })
                    if (column.kind === 'custom') {
                      setCustomAssignments((current) => ({ ...current, [created._id]: column.id }))
                    }
                    return created
                  }}
                />
              )}
            </Column>
          ))}
          <div className="w-[26rem] flex-none pt-4">
            {addingSection ? (
              <form onSubmit={createSection} className="rounded-lg border border-white/10 bg-[#252628] p-3">
                <input
                  autoFocus
                  value={sectionName}
                  onChange={(event) => setSectionName(event.target.value)}
                  onKeyDown={(event) => event.key === 'Escape' && setAddingSection(false)}
                  placeholder="Section name"
                  className="w-full rounded-md border border-white/15 bg-[#2a2b2d] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/40"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => { setAddingSection(false); setSectionName('') }} className="px-2 py-1 text-sm text-slate-400">Cancel</button>
                  <button disabled={!sectionName.trim()} className="rounded bg-rose-500 px-3 py-1 text-sm text-white disabled:opacity-50">Add</button>
                </div>
              </form>
            ) : (
              <button onClick={() => setAddingSection(true)} className="flex items-center gap-2 rounded-lg px-3 py-4 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white">
                <Plus className="h-4 w-4" /> Add section
              </button>
            )}
          </div>
        </div>
        <DragOverlay>{activeTask ? <CardBody task={activeTask} project={project} /> : null}</DragOverlay>
      </DndContext>
    </div>
  )
}
