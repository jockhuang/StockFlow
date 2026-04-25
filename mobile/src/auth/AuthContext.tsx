import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { WarehouseApi, type TokenPair } from '../api/client'
import type { UserProfile } from '../types'

type SignInConfig = {
  baseUrl: string
  username: string
  password: string
}

type StoredSession = {
  baseUrl: string
  accessToken: string
  refreshToken: string
}

type AuthContextValue = {
  baseUrl: string
  profile: UserProfile | null
  ready: boolean
  signingIn: boolean
  api: WarehouseApi | null
  signIn: (config: SignInConfig) => Promise<void>
  signOut: () => Promise<void>
}

const STORAGE_KEY = 'stockflow-mobile-session'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [baseUrl, setBaseUrl] = useState('')
  const [tokens, setTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [ready, setReady] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  const persistTokens = async (base: string, t: { accessToken: string; refreshToken: string }) => {
    const stored: StoredSession = { baseUrl: base, accessToken: t.accessToken, refreshToken: t.refreshToken }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  }

  const api = useMemo(() => {
    if (!baseUrl || !tokens) return null

    return new WarehouseApi(
      baseUrl,
      tokens,
      (newTokens: TokenPair) => {
        const updated = { accessToken: newTokens.accessToken, refreshToken: newTokens.refreshToken }
        setTokens(updated)
        void persistTokens(baseUrl, updated)
      },
    )
  }, [baseUrl, tokens])

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
      const session = JSON.parse(raw) as StoredSession
      const sessionTokens = { accessToken: session.accessToken, refreshToken: session.refreshToken }
      const nextApi = new WarehouseApi(session.baseUrl, sessionTokens)
      const nextProfile = await nextApi.me()
      setBaseUrl(session.baseUrl)
      setTokens(sessionTokens)
      setProfile(nextProfile)
    } catch {
      await AsyncStorage.removeItem(STORAGE_KEY)
    } finally {
      setReady(true)
    }
  }

  async function signIn(config: SignInConfig) {
    setSigningIn(true)
    try {
      const tokenPair = await WarehouseApi.login(config.baseUrl, config.username, config.password)
      const sessionTokens = { accessToken: tokenPair.accessToken, refreshToken: tokenPair.refreshToken }
      const nextApi = new WarehouseApi(config.baseUrl, sessionTokens)
      const nextProfile = await nextApi.me()
      setBaseUrl(config.baseUrl)
      setTokens(sessionTokens)
      setProfile(nextProfile)
      await persistTokens(config.baseUrl, sessionTokens)
    } finally {
      setSigningIn(false)
    }
  }

  async function signOut() {
    setBaseUrl('')
    setTokens(null)
    setProfile(null)
    await AsyncStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ baseUrl, profile, ready, signingIn, api, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
