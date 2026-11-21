import { createApiThunk } from '../../../lib/create-api-thunk'
import { projectsApi } from '../api/projects.api'

import type { IProjects } from '../types/projects.types'

export const fetchProjects = createApiThunk<string, IProjects.Project[]>('projects/fetchAll', async () => (await projectsApi.getAll()).data)
export const fetchProject = createApiThunk<string, IProjects.Project>('projects/fetchOne', async (id) => (await projectsApi.getById(id)).data)
export const createProject = createApiThunk<IProjects.CreatePayload, IProjects.Project>('projects/create', async (data) => (await projectsApi.create(data)).data)
export const updateProject = createApiThunk<{ id: string; changes: IProjects.UpdatePayload }, IProjects.Project>('projects/update', async ({ id, changes }) => (await projectsApi.update(id, changes)).data)
export const deleteProject = createApiThunk<string, string>('projects/delete', async (id) => {
  await projectsApi.remove(id)
  return id
})
export const toggleProjectFavorite = createApiThunk<string, { id: string; isFavorite: boolean }>('projects/toggleFavorite', async (id) => ({
  id,
  isFavorite: (await projectsApi.toggleFavorite(id)).data.isFavorite,
}))
