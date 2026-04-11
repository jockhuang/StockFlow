import { authorizationHeader } from './auth'

export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, secured = true): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  if (secured) {
    const authHeader = authorizationHeader()
    if (authHeader) {
      headers.set('Authorization', authHeader)
    }
  }

  const response = await fetch(path, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed with status ${response.status}.`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
