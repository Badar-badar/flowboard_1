export const TASK_STATUSES = [
  { value: 'todo', label: 'To do', dot: 'bg-slate-400' },
  { value: 'in_progress', label: 'In progress', dot: 'bg-blue-400' },
  { value: 'done', label: 'Done', dot: 'bg-emerald-400' },
]

export const TASK_DUE_SECTIONS = [
  { id: 'recent', label: 'Recently assigned' },
  { id: 'today', label: 'Do today' },
  { id: 'week', label: 'Do next week' },
  { id: 'later', label: 'Do later' },
  { id: 'overdue', label: 'Overdue' },
]

export const addDaysToDateInput = (value, count) => {
  const date = new Date(`${value}T00:00:00`)
  date.setDate(date.getDate() + count)
  return toDateInput(date)
}

export const getTaskDueSection = (task, today) => {
  if (!task.dueDate) return 'recent'
  const due = toDateInput(task.dueDate)
  if (due < today && task.status !== 'done') return 'overdue'
  if (due <= today) return 'today'
  if (due <= addDaysToDateInput(today, 7)) return 'week'
  return 'later'
}

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', className: 'bg-slate-500/20 text-slate-300' },
  { value: 'medium', label: 'Medium', className: 'bg-blue-500/20 text-blue-300' },
  { value: 'high', label: 'High', className: 'bg-amber-500/20 text-amber-300' },
  { value: 'urgent', label: 'Urgent', className: 'bg-rose-500/20 text-rose-300' },
]

export const priorityMeta = (value) =>
  TASK_PRIORITIES.find((priority) => priority.value === value) ?? TASK_PRIORITIES[1]

export const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

export const toDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const isOverdue = (task) => {
  if (!task?.dueDate || task.status === 'done') return false
  const dueDate = new Date(task.dueDate)
  if (Number.isNaN(dueDate.getTime())) return false
  dueDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return dueDate < today
}

export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export const MAX_FILES = 5
export const MAX_FILE_SIZE = 10 * 1024 * 1024
