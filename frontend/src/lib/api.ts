import { authorizationHeader, refreshAccessToken, signOut } from './auth'

export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, secured = true): Promise<T> {
  const response = await doFetch(path, init, secured)

  // Access token expired — try to refresh once, then retry
  if (response.status === 401 && secured) {
    try {
      await refreshAccessToken()
    } catch {
      signOut()
      throw new Error('Session expired. Please sign in again.')
    }

    const retryResponse = await doFetch(path, init, secured)
    return extractBody(retryResponse)
  }

  return extractBody(response)
}

async function doFetch(path: string, init: RequestInit, secured: boolean): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  if (secured) {
    const authHeader = authorizationHeader()
    if (authHeader) headers.set('Authorization', authHeader)
  }

  return fetch(path, { ...init, headers })
}

async function extractBody<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed with status ${response.status}.`)
  }

  if (response.status === 204) return undefined as T

  return (await response.json()) as T
}
