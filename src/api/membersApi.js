import axiosClient from './axios'

export const membersApi = {
  getByProject: (projectId) => axiosClient.get(`/project/${projectId}/members`),
}