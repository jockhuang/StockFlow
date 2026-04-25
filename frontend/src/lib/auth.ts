import { reactive } from 'vue'

type UserProfile = {
  username: string
  authorities: string[]
}

type StoredTokens = {
  accessToken: string
  refreshToken: string
}

const STORAGE_KEY = 'warehouse-auth'

export const authState = reactive<{
  accessToken: string
  refreshToken: string
  profile: UserProfile | null
  initialized: boolean
  version: number
}>({
  accessToken: '',
  refreshToken: '',
  profile: null,
  initialized: false,
  version: 0,
})

function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, refreshToken }))
}

function loadTokens(): StoredTokens | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<StoredTokens>
    if (!parsed.accessToken || !parsed.refreshToken) return null
    return parsed as StoredTokens
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function authorizationHeader() {
  return authState.accessToken ? `Bearer ${authState.accessToken}` : ''
}

async function fetchProfile() {
  const response = await fetch('/api/auth/me', {
    headers: {
      Authorization: authorizationHeader(),
      Accept: 'application/json',
    },
  })

  if (!response.ok) throw new Error('Authentication failed.')

  const profile = (await response.json()) as UserProfile
  authState.profile = profile
  return profile
}

export async function refreshAccessToken(): Promise<void> {
  if (!authState.refreshToken) {
    throw new Error('No refresh token available.')
  }

  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken: authState.refreshToken }),
  })

  if (!response.ok) {
    throw new Error('Refresh token expired or invalid.')
  }

  const data = (await response.json()) as { accessToken: string; refreshToken: string }
  authState.accessToken = data.accessToken
  authState.refreshToken = data.refreshToken
  saveTokens(data.accessToken, data.refreshToken)
}

export async function signIn(username: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) throw new Error('Invalid username or password.')

  const data = (await response.json()) as { accessToken: string; refreshToken: string }
  authState.accessToken = data.accessToken
  authState.refreshToken = data.refreshToken
  saveTokens(data.accessToken, data.refreshToken)

  const profile = await fetchProfile()
  authState.version += 1
  return profile
}

export function signOut() {
  authState.accessToken = ''
  authState.refreshToken = ''
  authState.profile = null
  authState.version += 1
  localStorage.removeItem(STORAGE_KEY)
}

export async function initializeAuth() {
  const tokens = loadTokens()
  if (!tokens) {
    authState.initialized = true
    return
  }

  authState.accessToken = tokens.accessToken
  authState.refreshToken = tokens.refreshToken

  try {
    await fetchProfile()
  } catch {
    // access token may be expired — try refreshing once
    try {
      await refreshAccessToken()
      await fetchProfile()
    } catch {
      signOut()
    }
  } finally {
    authState.initialized = true
  }
}

export function hasAuthority(authority?: string) {
  if (!authority) return true
  return authState.profile?.authorities.includes(authority) ?? false
}
