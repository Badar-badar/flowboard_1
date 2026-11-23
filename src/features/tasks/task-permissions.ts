import type { ITasks } from './types/tasks.types'

export type TaskRole = 'admin' | 'editor' | 'commenter' | 'viewer' | string | undefined

export const canEditTasks = (role: TaskRole) => role === 'admin' || role === 'editor'

// editors and admins always; anyone else only on a task assigned to them
export const canChangeStatus = (role: TaskRole, task: ITasks.Task, meId?: string | null) =>
  canEditTasks(role) || (!!meId && task.assigneeId === meId)

export const canManageAttachments = canChangeStatus
