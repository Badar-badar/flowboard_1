import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import TaskRow, { ROW_GRID } from './TaskRow'
import AddTaskRow from './AddTaskRow'
import { useTasks } from '../../features/tasks/useTasks'
import { useProjectMembers } from '../../features/members/useProjectMembers'
import { TASK_STATUSES } from '../../lib/taskConstants'
import { canEditTasks } from '../../lib/taskPermissions'

export default function TaskListView({ projectId, role, onOpen }) {
  const { tasks, loaded, error, clearError, addTask, editTask } = useTasks(projectId)
  const { members, meId } = useProjectMembers(projectId)
  const [collapsed, setCollapsed] = useState({})
  const canAdd = canEditTasks(role)

  const groups = useMemo(
    () => TASK_STATUSES.map((s) => ({ ...s, items: tasks.filter((t) => t.status === s.value) })),
    [tasks],
  )

  const onEdit = (id, changes) => editTask(id, changes).catch(() => {})

  if (!loaded) return <p className="py-10 text-slate-400">Loading tasks...</p>

  return (
    <div>
      {error && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
          <button onClick={clearError} className="underline">Dismiss</button>
        </div>
      )}

      <div className={`${ROW_GRID} border-b border-t border-white/10 text-sm text-slate-400`}>
        <span className="px-6 py-2.5">Name</span>
        <span className="border-l border-white/10 px-3 py-2.5">Assignee</span>
        <span className="border-l border-white/10 px-3 py-2.5">Due date</span>
        <span className="border-l border-white/10 px-3 py-2.5">Priority</span>
      </div>

      {groups.map((g) => (
        <section key={g.value}>
          <button
            onClick={() => setCollapsed({ ...collapsed, [g.value]: !collapsed[g.value] })}
            className="flex w-full items-center gap-2 border-b border-white/10 px-3 py-3 text-left"
          >
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${collapsed[g.value] ? '-rotate-90' : ''}`} />
            <span className={`h-2.5 w-2.5 rounded-full ${g.dot}`} />
            <span className="text-lg font-semibold text-white">{g.label}</span>
            <span className="text-sm text-slate-500">{g.items.length}</span>
          </button>

          {!collapsed[g.value] && (
            <>
              {g.items.map((t) => (
                <TaskRow key={t._id} task={t} role={role} meId={meId} members={members} onOpen={onOpen} onEdit={onEdit} />
              ))}
              {canAdd && (
                <div className="border-b border-white/10">
                  <AddTaskRow onAdd={(title) => addTask({ title, status: g.value })} />
                </div>
              )}
            </>
          )}
        </section>
      ))}

      {!tasks.length && (
        <p className="py-8 text-center text-sm text-slate-500">
          {canAdd ? 'No tasks yet. Use "Add task" under any group to create one.' : 'No tasks in this project yet.'}
        </p>
      )}
    </div>
  )
}