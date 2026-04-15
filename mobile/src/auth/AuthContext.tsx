import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { WarehouseApi } from '../api/client'
import type { UserProfile } from '../types'

type SessionConfig = {
  baseUrl: string
  username: string
  password: string
}

type AuthContextValue = {
  baseUrl: string
  profile: UserProfile | null
  ready: boolean
  signingIn: boolean
  api: WarehouseApi | null
  signIn: (config: SessionConfig) => Promise<void>
  signOut: () => Promise<void>
}

const STORAGE_KEY = 'stockflow-mobile-session'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [baseUrl, setBaseUrl] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [credentials, setCredentials] = useState<Omit<SessionConfig, 'baseUrl'> | null>(null)
  const [ready, setReady] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  const api = useMemo(() => {
    if (!baseUrl || !credentials) {
      return null
    }
    return new WarehouseApi(baseUrl, credentials)
  }, [baseUrl, credentials])

  useEffect(() => {
    void restoreSession()
  }, [])

  async function restoreSession() {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) {
      setReady(true)
      return
    }

    try {
      const session = JSON.parse(raw) as SessionConfig
      const nextApi = new WarehouseApi(session.baseUrl, {
        username: session.username,
        password: session.password,
      })
      const nextProfile = await nextApi.me()
      setBaseUrl(session.baseUrl)
      setCredentials({ username: session.username, password: session.password })
      setProfile(nextProfile)
    } catch {
      await AsyncStorage.removeItem(STORAGE_KEY)
    } finally {
      setReady(true)
    }
  }

  async function signIn(config: SessionConfig) {
    setSigningIn(true)
    try {
      const nextApi = new WarehouseApi(config.baseUrl, {
        username: config.username,
        password: config.password,
      })
      const nextProfile = await nextApi.me()
      setBaseUrl(config.baseUrl)
      setCredentials({ username: config.username, password: config.password })
      setProfile(nextProfile)
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } finally {
      setSigningIn(false)
    }
  }

  async function signOut() {
    setBaseUrl('')
    setProfile(null)
    setCredentials(null)
    await AsyncStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        baseUrl,
        profile,
        ready,
        signingIn,
        api,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }
  return context
}
