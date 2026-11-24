import axios, { type AxiosRequestConfig } from 'axios'
import { auth } from './firebase.config'
import { store } from '../app/store'
import environment from './environment'



const axiosInstance = axios.create({
  baseURL: environment.api.baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})



axiosInstance.interceptors.request.use(async (config) => {
  const token = await auth.currentUser?.getIdToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  else config.headers.delete('Authorization')
  if (config.data instanceof FormData) config.headers.delete('Content-Type')
  const workspaceId = store.getState().workspace.activeId
  if (workspaceId) config.headers['x-workspace-id'] = workspaceId
  return config
})

axiosInstance.interceptors.response.use(
  (res) => res.data,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const body: unknown = error.response?.data
      const serverMessage = body && typeof body === 'object'
        ? 'message' in body && typeof body.message === 'string'
          ? body.message
          : 'error' in body && typeof body.error === 'string'
            ? body.error
            : undefined
        : typeof body === 'string' ? body : undefined
      return Promise.reject({ code: error.code, message: serverMessage ?? error.message ?? 'Something went wrong', status: error.response?.status })
    }
    return Promise.reject({ code: 'UNKNOWN', message: 'Something went wrong' })
  }
)

interface ApiClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  delete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
}

const axiosClient = axiosInstance as unknown as ApiClient
export default axiosClient
