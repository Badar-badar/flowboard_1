import axiosClient from '../../../configs/axios.config'
import type { IMembers } from '../types/members.types'

export const membersApi = {
  getByProject: (projectId: string) => axiosClient.get<IMembers.ListResponse>(`/project/${projectId}/members`),
  addToProject: (projectId: string, data: { email: string; role?: string }) => axiosClient.post<{ invited: boolean; data: IMembers.Member | IMembers.Invitation }>(`/project/${projectId}/members`, data),
  updateProjectRole: (projectId: string, userId: string, role: string) => axiosClient.patch(`/project/${projectId}/members/${userId}`, { role }),
  removeFromProject: (projectId: string, userId: string) => axiosClient.delete(`/project/${projectId}/members/${userId}`),
  getProjectInvitations: (projectId: string) => axiosClient.get<{ data: IMembers.Invitation[] }>(`/project/${projectId}/invitations`),
  updateProjectInvitationRole: (projectId: string, invitationId: string, role: string) => axiosClient.patch(`/project/${projectId}/invitations/${invitationId}`, { role }),
  revokeProjectInvitation: (projectId: string, invitationId: string) => axiosClient.delete(`/project/${projectId}/invitations/${invitationId}`),
}
