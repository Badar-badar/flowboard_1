
import axiosClient from '../../../configs/axios.config'
import type { IAuth } from '../types/auth.types'

export const authApi = {
  syncUser: (data: IAuth.SyncUserPayload) => axiosClient.post<unknown>('/auth/sync', data),
  getMe: () => axiosClient.get<IAuth.MeResponse>('/auth/me'),
}
