import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth'

export const http = axios.create({
  baseURL: env.apiBaseUrl || '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? 'GET').toUpperCase()
  const requestUrl = config.url ?? ''
  const requestBaseUrl = config.baseURL ?? env.apiBaseUrl ?? ''
  const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : ''

  let resolvedUrl = requestUrl
  let targetHost = ''

  try {
    const fallbackBase = requestBaseUrl || runtimeOrigin || 'http://localhost'
    const absoluteUrl = new URL(requestUrl, fallbackBase)
    resolvedUrl = absoluteUrl.toString()
    targetHost = absoluteUrl.host
  } catch {
    // Preserve the original URL when it cannot be normalized.
  }

  console.info('[api]', {
    method,
    apiBaseUrl: env.apiBaseUrl || '(empty)',
    requestBaseUrl: requestBaseUrl || '(empty)',
    runtimeOrigin: runtimeOrigin || '(unavailable)',
    targetHost: targetHost || '(unknown)',
    url: resolvedUrl,
  })

  return config
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
