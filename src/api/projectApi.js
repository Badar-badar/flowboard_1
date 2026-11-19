import axiosClient from './axios'

export const projectsApi = {
  getAll: () => axiosClient.get('/project'),
  getById: (id) => axiosClient.get(`/project/${id}`),
  create: (data) => axiosClient.post('/project', data),
  update: (id, data) => axiosClient.patch(`/project/${id}`, data),
  remove: (id) => axiosClient.delete(`/project/${id}`),
}