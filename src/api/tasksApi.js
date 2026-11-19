import axiosClient from './axios'

export const tasksApi = {
  getByProject: (projectId) => axiosClient.get(`/task/project/${projectId}`),
  getMine: () => axiosClient.get('/task', { params: { assigneeId: 'me' } }),
  getById: (id) => axiosClient.get(`/task/${id}`),
  create: (projectId, formData) => axiosClient.post(`/task/project/${projectId}`, formData),
  update: (id, changes) => axiosClient.patch(`/task/${id}`, changes), // JSON is accepted when there are no files
  remove: (id) => axiosClient.delete(`/task/${id}`),
  addAttachments: (id, formData) => axiosClient.post(`/task/${id}/attachments`, formData),
  removeAttachment: (id, attachmentId) => axiosClient.delete(`/task/${id}/attachments/${attachmentId}`),
}