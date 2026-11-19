import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CheckCircle2 } from 'lucide-react'
import TaskCheck from '../components/tasks/TaskCheck'
import { useMyTasks } from '../features/tasks/useTasks'
import { projectsSelectors } from '../features/projects/projectsSlice'
import { formatDate, isOverdue, toDateInput } from '../lib/taskConstants'
import { PATHS } from '../routes/paths'

const TABS = [
  { key: 'upcoming', label: 'Upcoming', empty: 'Tasks assigned to you that are not overdue will appear here.' },
  { key: 'overdue', label: 'Overdue', empty: 'Nothing is overdue. Nice work.' },
  { key: 'completed', label: 'Completed', empty: 'Your completed tasks will appear here, so you can reference them later.' },
]

export default function MyTasks() {
  const { tasks, loaded, toggleDone } = useMyTasks()
  const projects = useSelector(projectsSelectors.selectEntities)
  const [tab, setTab] = useState('upcoming')

  const list = useMemo(() => {
    const filters = {
      upcoming: (t) => t.status !== 'done' && !isOverdue(t),
      overdue: (t) => isOverdue(t),
      completed: (t) => t.status === 'done',
    }
    const byDue = (a, b) => (toDateInput(a.dueDate) || '9999').localeCompare(toDateInput(b.dueDate) || '9999')
    return tasks.filter(filters[tab]).sort(byDue)
  }, [tasks, tab])

  const current = TABS.find((t) => t.key === tab)

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-white">My tasks</h1>

      <div className="mb-4 flex gap-1 border-b border-white/10 pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-[15px] font-medium ${tab === t.key ? 'bg-blue-950 text-blue-400' : 'text-slate-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!loaded && <p className="text-slate-400">Loading tasks...</p>}

      {loaded && !list.length && (
        <div className="flex flex-col items-center py-16 text-center">
          <CheckCircle2 className="mb-3 h-12 w-12 text-slate-500" />
          <p className="max-w-sm text-slate-400">{current.empty}</p>
        </div>
      )}

      {list.map((t) => (
        <Link
          key={t._id}
          to={`${PATHS.projectDetail(t.projectId)}?task=${t._id}`}
          className="flex items-center gap-3 border-b border-white/10 px-2 py-3 hover:bg-white/5"
        >
          <TaskCheck done={t.status === 'done'} onToggle={() => toggleDone(t).catch(() => {})} />
          <span className={`flex-1 truncate ${t.status === 'done' ? 'text-slate-500 line-through' : 'text-white'}`}>{t.title}</span>
          <span className="truncate text-sm text-slate-400">{projects[t.projectId]?.name}</span>
          <span className={`w-16 text-right text-sm ${isOverdue(t) ? 'text-red-400' : 'text-slate-400'}`}>{formatDate(t.dueDate)}</span>
        </Link>
      ))}
    </div>
  )
}