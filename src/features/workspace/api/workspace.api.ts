import axiosClient from '../../../configs/axios.config'
import type { IWorkspace } from '../types/workspace.types'

export const workspaceApi = {
  getMine: () => axiosClient.get<{ data: IWorkspace.Workspace[] }>('/workspace'),
  create: (data: IWorkspace.CreatePayload) => axiosClient.post<{ data: IWorkspace.Workspace }>('/workspace', data),
}
