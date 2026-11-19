import TaskCheck from './TaskCheck'
import AssigneePicker from './AssigneePicker'
import DueDatePicker from './DueDatePicker'
import { priorityMeta } from '../../lib/taskConstants'
import { canChangeStatus, canEditTasks } from '../../lib/taskPermissions'

export const ROW_GRID = 'grid grid-cols-[1fr_170px_130px_100px]'

export default function TaskRow({ task, role, meId, members, onOpen, onEdit }) {
  const fullEdit = canEditTasks(role)
  const statusOk = canChangeStatus(role, task, meId)
  const priority = priorityMeta(task.priority)
  const done = task.status === 'done'

  return (
    <div onClick={() => onOpen(task._id)} className={`${ROW_GRID} cursor-pointer items-center border-b border-white/10 hover:bg-white/5`}>
      <div className="flex min-w-0 items-center gap-3 py-2.5 pl-6">
        <TaskCheck done={done} disabled={!statusOk} onToggle={() => onEdit(task._id, { status: done ? 'todo' : 'done' })} />
        <span className={`truncate text-[15px] ${done ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</span>
      </div>
      <div className="border-l border-white/10 px-3 py-1.5">
        <AssigneePicker members={members} assigneeId={task.assigneeId} canEdit={fullEdit} onChange={(id) => onEdit(task._id, { assigneeId: id })} />
      </div>
      <div className="border-l border-white/10 px-3 py-1.5">
        <DueDatePicker task={task} canEdit={fullEdit} onChange={(d) => onEdit(task._id, { dueDate: d })} />
      </div>
      <div className="border-l border-white/10 px-3 py-1.5">
        <span className={`rounded-full px-2 py-0.5 text-xs ${priority.className}`}>{priority.label}</span>
      </div>
    </div>
  )
}