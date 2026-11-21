import axiosClient from '../../../configs/axios.config'
import type { IProjects } from '../types/projects.types'

export const projectsApi = {
  getAll: () => axiosClient.get<IProjects.ListResponse>('/project'),
  getById: (id: string) => axiosClient.get<IProjects.ItemResponse>(`/project/${id}`),
  create: (data: IProjects.CreatePayload) => axiosClient.post<IProjects.ItemResponse>('/project', data),
  update: (id: string, data: IProjects.UpdatePayload) => axiosClient.patch<IProjects.ItemResponse>(`/project/${id}`, data),
  remove: (id: string) => axiosClient.delete(`/project/${id}`),
  toggleFavorite: (projectId: string) => axiosClient.post<{ data: { isFavorite: boolean } }>(`/project/${projectId}/favorite`),
}
