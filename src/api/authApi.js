
import axiosClient from './axios'

export const authApi = {
  syncUser: (data, idToken) => axiosClient.post('/auth/sync', data, {
    headers: { Authorization: `Bearer ${idToken}` },
  }),
  getMe: (idToken) => axiosClient.get('/auth/me', {
    headers: { Authorization: `Bearer ${idToken}` },
  }),
}
