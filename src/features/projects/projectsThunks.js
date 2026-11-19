import { createApiThunk } from '../createApiThunk'
import { projectsApi } from '../../api/projectApi'

export const fetchProjects = createApiThunk('projects/fetchAll', async () => (await projectsApi.getAll()).data)
export const fetchProject = createApiThunk('projects/fetchOne', async (id) => (await projectsApi.getById(id)).data)
export const createProject = createApiThunk('projects/create', async (data) => (await projectsApi.create(data)).data)
export const updateProject = createApiThunk('projects/update', async ({ id, changes }) => (await projectsApi.update(id, changes)).data)
export const deleteProject = createApiThunk('projects/delete', async (id) => {
  await projectsApi.remove(id)
  return id
})
