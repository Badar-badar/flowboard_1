import axiosClient from '../../../configs/axios.config'
import type { IWorkspace } from '../types/workspace.types'

export const workspaceApi = {
  getMine: () => axiosClient.get<{ data: IWorkspace.Workspace[] }>('/workspace'),
  create: (data: IWorkspace.CreatePayload) => axiosClient.post<{ data: IWorkspace.Workspace }>('/workspace', data),
  getMembers: (workspaceId: string) => axiosClient.get<{ data: IWorkspace.Member[] }>(`/workspace/${workspaceId}/members`),
  addMember: (workspaceId: string, email: string) => axiosClient.post<{ data: IWorkspace.Member }>(`/workspace/${workspaceId}/members`, { email }),
  removeMember: (workspaceId: string, userId: string) => axiosClient.delete(`/workspace/${workspaceId}/members/${userId}`),
}
