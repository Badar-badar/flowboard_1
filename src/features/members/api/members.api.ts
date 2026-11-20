import axiosClient from '../../../configs/axios.config'
import type { IMembers } from '../types/members.types'

export const membersApi = {
  getByProject: (projectId: string) => axiosClient.get<IMembers.ListResponse>(`/project/${projectId}/members`),
}
