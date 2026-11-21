import axiosClient from '../../../configs/axios.config'

export interface TaskComment {
  _id: string
  taskId: string
  body: string
  authorId: string | { _id?: string; uid?: string; userId?: string; name?: string; email?: string; avatarUrl?: string }
  createdAt?: string
  updatedAt?: string
}

export const commentsApi = {
  getByTask: (taskId: string) => axiosClient.get<{ data: TaskComment[] }>(`/task/${taskId}/comments`),
  create: (taskId: string, body: string) => axiosClient.post<{ data: TaskComment }>(`/task/${taskId}/comments`, { body }),
  update: (commentId: string, body: string) => axiosClient.patch<{ data: TaskComment }>(`/comment/${commentId}`, { body }),
  remove: (commentId: string) => axiosClient.delete(`/comment/${commentId}`),
}
