import { expect, type APIRequestContext, request } from '@playwright/test'
import { apiBaseUrl, type TestAccount } from './accounts'

export async function authenticatedApi(account: TestAccount) {
  const loginContext = await request.newContext({
    baseURL: apiBaseUrl(),
    extraHTTPHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  const response = await loginContext.post('/api/auth/login', {
    data: {
      email: account.email,
      password: account.password,
    },
  })

  expect(response.status(), await safeBody(response)).toBeLessThan(300)
  const cookieHeader = authCookieHeader(response.headers()['set-cookie'])
  await loginContext.dispose()

  const context = await request.newContext({
    baseURL: apiBaseUrl(),
    extraHTTPHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  })

  return context
}

export async function disposeApi(context: APIRequestContext) {
  await context.dispose()
}

export function itemsFromPagedResponse(payload: any): any[] {
  const candidates = [
    payload?.content,
    payload?.data?.content,
    payload?.data,
    payload?.items,
    payload,
  ]
  const match = candidates.find(Array.isArray)
  return match ?? []
}

export async function safeJson(response: { json: () => Promise<unknown> }) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function safeBody(response: { text: () => Promise<string> }) {
  try {
    return await response.text()
  } catch {
    return ''
  }
}

function authCookieHeader(setCookie: string | undefined) {
  if (!setCookie) return ''
  const match = setCookie.match(/AUTH_TOKEN=([^;]+)/)
  return match ? `AUTH_TOKEN=${match[1]}` : ''
}
