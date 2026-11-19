import axios from 'axios'
import { auth } from '../lib/firebase'
import { store } from '../store'



const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})



axiosClient.interceptors.request.use(async (config) => {
  const token = await auth.currentUser?.getIdToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.data instanceof FormData) config.headers.delete('Content-Type')
  const workspaceId = store.getState().workspace.activeId
  if (workspaceId) config.headers['x-workspace-id'] = workspaceId
  return config
})

axiosClient.interceptors.response.use(
  (res) => res.data,
  (error) =>
    Promise.reject({
      code: error.code,
      message: error.response?.data?.message || error.response?.data?.error || error.message || 'Something went wrong',
      status: error.response?.status,
      data: error.response?.data,
    })
)

export default axiosClient
