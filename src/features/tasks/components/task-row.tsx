import { MoreHorizontal, Trash2 } from 'lucide-react'
import Dropdown from '../../../components/ui/dropdown'
import TaskCheck from './task-check'
import AssigneePicker from './assignee-picker'
import DueDatePicker from './due-date-picker'
import { canChangeStatus, canEditTasks } from '../task-permissions'
import type { ITasks } from '../types/tasks.types'
import type { IMembers } from '../../members/types/members.types'

export const ROW_GRID = 'grid grid-cols-[minmax(0,4fr)_140px_140px_28px_minmax(0,1fr)] max-sm:grid-cols-[minmax(0,1fr)_28px]'

export default function TaskRow({ task, role, meId, members, onOpen, onEdit, onDelete, active = false }: {
  task: ITasks.Task
  role?: string
  meId?: string | null
  members: IMembers.Member[]
  onOpen: (taskId: string) => void
  onEdit: (taskId: string, changes: ITasks.UpdatePayload) => void
  onDelete: (task: ITasks.Task) => void
  active?: boolean
}) {
  const fullEdit = canEditTasks(role)
  const statusOk = canChangeStatus(role, task, meId)
  const done = task.status === 'done'

  return (
    <div onClick={() => onOpen(task._id)} aria-selected={active} className={`${ROW_GRID} group cursor-pointer items-center border-b border-white/10 ${active ? 'bg-blue-500/10 ring-1 ring-inset ring-blue-400/50' : 'hover:bg-white/[0.045]'}`}>
      <div className="flex min-w-0 items-center gap-3 py-2 pl-8 pr-3">
        <TaskCheck done={done} disabled={!statusOk} onToggle={() => onEdit(task._id, { status: done ? 'todo' : 'done' })} />
        <span className={`truncate text-[15px] ${done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{task.title}</span>
      </div>
      <div className="border-l border-white/10 px-2 py-1 max-sm:hidden">
        <AssigneePicker members={members} assigneeId={task.assigneeId} canEdit={fullEdit} onChange={(id) => onEdit(task._id, { assigneeId: id })} />
      </div>
      <div className="border-l border-white/10 px-2 py-1 max-sm:hidden">
        <DueDatePicker task={task} canEdit={fullEdit} onChange={(date) => onEdit(task._id, { dueDate: date })} />
      </div>
      <div className="flex h-full items-center justify-center border-l border-white/10">
        <Dropdown
          width="w-44"
          align="right"
          trigger={({ toggle }) => (
            <button type="button" onClick={(event) => { event.stopPropagation(); toggle() }} className="rounded-md p-1.5 text-slate-400 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100 focus:opacity-100" aria-label="Task options">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        >
          {({ close }) => (
            <div className="py-1" onClick={(event) => event.stopPropagation()}>
              <button type="button" onClick={() => { close(); onOpen(task._id) }} className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5">Open task details</button>
              {fullEdit && <button type="button" onClick={() => { close(); onDelete(task) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-300 hover:bg-white/5"><Trash2 className="h-4 w-4" />Delete task</button>}
            </div>
          )}
        </Dropdown>
      </div>
      <div className="max-sm:hidden" />
    </div>
  )
}
