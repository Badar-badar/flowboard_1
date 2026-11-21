import axiosClient from '../../../configs/axios.config'
import type { ITasks } from '../types/tasks.types'

export const tasksApi = {
  getByProject: (projectId: string) => axiosClient.get<ITasks.ListResponse>(`/task/project/${projectId}`),
  getMine: () => axiosClient.get<ITasks.ListResponse>('/task', { params: { assigneeId: 'me' } }),
  getById: (id: string) => axiosClient.get<ITasks.ItemResponse>(`/task/${id}`),
  create: (projectId: string, formData: FormData) => axiosClient.post<ITasks.ItemResponse>(`/task/project/${projectId}`, formData),
  update: (id: string, changes: ITasks.UpdatePayload) => axiosClient.patch<ITasks.ItemResponse>(`/task/${id}`, changes),
  remove: (id: string) => axiosClient.delete(`/task/${id}`),
  addAttachments: (id: string, formData: FormData) => axiosClient.post<ITasks.ItemResponse>(`/task/${id}/attachments`, formData),
  removeAttachment: (id: string, attachmentId: string) => axiosClient.delete<ITasks.ItemResponse>(`/task/${id}/attachments/${attachmentId}`),
  addProject: (id: string, projectId: string) => axiosClient.post<ITasks.ItemResponse>(`/task/${id}/projects`, { projectId }),
  removeProject: (id: string, projectId: string) => axiosClient.delete<ITasks.ItemResponse>(`/task/${id}/projects/${projectId}`),
}
