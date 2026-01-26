import axios, { AxiosError } from 'axios'
import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth'

export const http = axios.create({
  baseURL: env.apiBaseUrl || '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      // cookie expired or unauth
      try {
        const auth = useAuthStore()
        auth.logout()
      } catch {
        // store may not be initialized yet
      }
    }
    return Promise.reject(err)
  }
)
