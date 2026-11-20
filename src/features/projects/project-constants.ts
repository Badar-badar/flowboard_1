export const PROJECT_COLORS = [
  '#f06a6a', '#f1bd6c', '#7bc86c', '#4ecbc4',
  '#4573d2', '#8d84e8', '#e362e3', '#aa62e3',
]

export const PROJECT_STATUSES = [
  { value: 'active', label: 'Active', className: 'text-emerald-400' },
  { value: 'on_hold', label: 'On hold', className: 'text-amber-400' },
  { value: 'completed', label: 'Completed', className: 'text-sky-400' },
]

export const statusMeta = (value) =>
  PROJECT_STATUSES.find((s) => s.value === value) ?? PROJECT_STATUSES[0]