import { reactive } from 'vue'

type UserProfile = {
  username: string
  authorities: string[]
}

const STORAGE_KEY = 'warehouse-auth'

export const authState = reactive<{
  username: string
  password: string
  profile: UserProfile | null
  initialized: boolean
  version: number
}>({
  username: '',
  password: '',
  profile: null,
  initialized: false,
  version: 0,
})

function saveCredentials(username: string, password: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ username, password }))
}

function loadCredentials() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as { username: string; password: string }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function authorizationHeader() {
  if (!authState.username || !authState.password) {
    return ''
  }

  return `Basic ${btoa(`${authState.username}:${authState.password}`)}`
}

export async function fetchProfile() {
  const response = await fetch('/api/auth/me', {
    headers: {
      Authorization: authorizationHeader(),
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Authentication failed.')
  }

  const profile = (await response.json()) as UserProfile
  authState.profile = profile
  return profile
}

export async function signIn(username: string, password: string) {
  authState.username = username
  authState.password = password
  saveCredentials(username, password)
  const profile = await fetchProfile()
  authState.version += 1
  return profile
}

export function signOut() {
  authState.username = ''
  authState.password = ''
  authState.profile = null
  authState.version += 1
  localStorage.removeItem(STORAGE_KEY)
}

export async function initializeAuth() {
  const saved = loadCredentials()
  if (!saved) {
    authState.initialized = true
    return
  }

  authState.username = saved.username
  authState.password = saved.password

  try {
    await fetchProfile()
  } catch {
    signOut()
  } finally {
    authState.initialized = true
  }
}

export function hasAuthority(authority?: string) {
  if (!authority) {
    return true
  }

  return authState.profile?.authorities.includes(authority) ?? false
}
