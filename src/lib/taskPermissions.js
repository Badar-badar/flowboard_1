export const canEditTasks = (role) => role === 'admin' || role === 'editor'

// editors and admins always; anyone else only on a task assigned to them
export const canChangeStatus = (role, task, meId) =>
  canEditTasks(role) || (!!meId && task.assigneeId === meId)

export const canManageAttachments = canChangeStatus