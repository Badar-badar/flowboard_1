import { createApiThunk } from '../createApiThunk'
import { tasksApi } from '../../api/tasksApi'

// the backend create endpoint is multipart, and empty fields must be left out (strict body)
const toFormData = ({ files = [], ...fields }) => {
  const fd = new FormData()
  Object.entries(fields).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') fd.append(k, v)
  })
  files.forEach((f) => fd.append('files', f))
  return fd
}

export const fetchProjectTasks = createApiThunk('tasks/fetchByProject', async (projectId) => {
  const res = await tasksApi.getByProject(projectId)
  return res.data
})

export const fetchMyTasks = createApiThunk('tasks/fetchMine', async () => (await tasksApi.getMine()).data)

export const fetchTask = createApiThunk('tasks/fetchOne', async (id) => (await tasksApi.getById(id)).data)

export const createTask = createApiThunk('tasks/create', async ({ projectId, data }) =>
  (await tasksApi.create(projectId, toFormData(data))).data,
)

// optimistic: the slice applies `changes` immediately and rolls back on failure
export const updateTask = createApiThunk('tasks/update', async ({ id, changes }) =>
  (await tasksApi.update(id, changes)).data,
)

export const deleteTask = createApiThunk('tasks/delete', async (id) => {
  await tasksApi.remove(id)
  return id
})

export const uploadAttachments = createApiThunk('tasks/addAttachments', async ({ id, files }) =>
  (await tasksApi.addAttachments(id, toFormData({ files }))).data,
)

export const deleteAttachment = createApiThunk('tasks/removeAttachment', async ({ id, attachmentId }) =>
  (await tasksApi.removeAttachment(id, attachmentId)).data,
)