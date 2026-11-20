import { createApiThunk } from '../../../lib/create-api-thunk'
import { tasksApi } from '../api/tasks.api'
import type { ITasks } from '../types/tasks.types'

// the backend create endpoint is multipart, and empty fields must be left out (strict body)
type FormFields = Partial<Pick<ITasks.Task, 'title' | 'description' | 'status' | 'priority' | 'assigneeId' | 'dueDate'>> & { files?: File[] }

const toFormData = ({ files = [], ...fields }: FormFields) => {
  const fd = new FormData()
  Object.entries(fields).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') fd.append(k, String(v))
  })
  files.forEach((f) => fd.append('files', f))
  return fd
}

export const fetchProjectTasks = createApiThunk<string, ITasks.Task[]>('tasks/fetchByProject', async (projectId) => {
  const res = await tasksApi.getByProject(projectId)
  return res.data
})

export const fetchMyTasks = createApiThunk<void, ITasks.Task[]>('tasks/fetchMine', async () => (await tasksApi.getMine()).data)

export const fetchTask = createApiThunk<string, ITasks.Task>('tasks/fetchOne', async (id) => (await tasksApi.getById(id)).data)

export const createTask = createApiThunk<{ projectId: string; data: ITasks.CreatePayload }, ITasks.Task>('tasks/create', async ({ projectId, data }) =>
  (await tasksApi.create(projectId, toFormData(data))).data,
)

// optimistic: the slice applies `changes` immediately and rolls back on failure
export const updateTask = createApiThunk<{ id: string; changes: ITasks.UpdatePayload }, ITasks.Task>('tasks/update', async ({ id, changes }) =>
  (await tasksApi.update(id, changes)).data,
)

export const deleteTask = createApiThunk<string, string>('tasks/delete', async (id) => {
  await tasksApi.remove(id)
  return id
})

export const uploadAttachments = createApiThunk<{ id: string; files: File[] }, ITasks.Task>('tasks/addAttachments', async ({ id, files }) =>
  (await tasksApi.addAttachments(id, toFormData({ files }))).data,
)

export const deleteAttachment = createApiThunk<{ id: string; attachmentId: string }, ITasks.Task>('tasks/removeAttachment', async ({ id, attachmentId }) =>
  (await tasksApi.removeAttachment(id, attachmentId)).data,
)
