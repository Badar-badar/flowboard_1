import axiosClient from './axios'

export const workspaceApi = {
  getMine: () => axiosClient.get('/workspace'),
  create: (data) => axiosClient.post('/workspace', data),
}