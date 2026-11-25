import axiosClient from '../../../configs/axios.config'
import type { IProjects } from '../types/projects.types'

const normalizeProjectDates = (project: IProjects.Project): IProjects.Project => ({
  ...project,
  dueDate: project.dueDate ?? project.endDate ?? null,
})

const normalizeList = (response: IProjects.ListResponse): IProjects.ListResponse => ({
  ...response,
  data: response.data.map(normalizeProjectDates),
})

const normalizeItem = (response: IProjects.ItemResponse): IProjects.ItemResponse => ({
  ...response,
  data: normalizeProjectDates(response.data),
})

export const projectsApi = {
  getAll: async () => normalizeList(await axiosClient.get<IProjects.ListResponse>('/project')),
  getById: async (id: string) => normalizeItem(await axiosClient.get<IProjects.ItemResponse>(`/project/${id}`)),
  create: async ({ workspaceId, ...data }: IProjects.CreatePayload) => normalizeItem(await axiosClient.post<IProjects.ItemResponse>('/project', data, {
    headers: { 'x-workspace-id': workspaceId },
  })),
  update: async (id: string, data: IProjects.UpdatePayload) => normalizeItem(await axiosClient.patch<IProjects.ItemResponse>(`/project/${id}`, data)),
  remove: (id: string) => axiosClient.delete(`/project/${id}`),
  toggleFavorite: (projectId: string) => axiosClient.post<{ data: { isFavorite: boolean } }>(`/project/${projectId}/favorite`),
}
