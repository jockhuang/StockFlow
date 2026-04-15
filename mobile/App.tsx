import React, { useState } from 'react'
import { Alert, Text } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import Constants from 'expo-constants'
import { AuthProvider, useAuth } from './src/auth/AuthContext'
import { Button, Card, LoadingBlock, Screen, TextField } from './src/components/ui'
import { DashboardScreen } from './src/screens/DashboardScreen'
import { HomeScreen, type AppScreenKey } from './src/screens/HomeScreen'
import { InventoryScreen } from './src/screens/InventoryScreen'
import { TransactionsScreen } from './src/screens/TransactionsScreen'
import { CategoriesScreen } from './src/screens/CategoriesScreen'
import { SuppliersScreen } from './src/screens/SuppliersScreen'
import { ItemSupplierRelationsScreen } from './src/screens/ItemSupplierRelationsScreen'
import { PurchaseOrdersScreen } from './src/screens/PurchaseOrdersScreen'
import { SalesOrdersScreen } from './src/screens/SalesOrdersScreen'
import { UsersScreen } from './src/screens/UsersScreen'
import { RolesScreen } from './src/screens/RolesScreen'
import { ResourcesScreen } from './src/screens/ResourcesScreen'

function LoginScreen() {
  const { signIn, signingIn } = useAuth()
  const defaultBaseUrl = String(Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://10.0.2.2:8080')
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('Admin@123456')

  async function submit() {
    try {
      await signIn({ baseUrl, username, password })
    } catch (error) {
      Alert.alert('Sign In Failed', error instanceof Error ? error.message : 'Unable to sign in.')
    }
  }

  return (
    <Screen title="Sign In" subtitle="StockFlow Mobile">
      <Card title="Backend Connection">
        <Text style={{ color: '#66748f' }}>
          Use `http://localhost:8080` for the iOS Simulator and `http://10.0.2.2:8080` for the Android Emulator.
        </Text>
        <TextField label="API Base URL" value={baseUrl} onChangeText={setBaseUrl} keyboardType="url" />
        <TextField label="Username" value={username} onChangeText={setUsername} />
        <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Button label={signingIn ? 'Signing In...' : 'Sign In'} onPress={submit} disabled={signingIn} />
      </Card>
    </Screen>
  )
}

function AppNavigator() {
  const { ready, profile, baseUrl, api, signOut } = useAuth()
  const [screen, setScreen] = useState<AppScreenKey | null>(null)

  if (!ready) {
    return <LoadingBlock label="Restoring session..." />
  }

  if (!profile || !api) {
    return <LoginScreen />
  }

  if (!screen) {
    return <HomeScreen profile={profile} baseUrl={baseUrl} onOpen={setScreen} onSignOut={() => void signOut()} />
  }

  const commonProps = {
    api,
    profile,
    onBack: () => setScreen(null),
  }

  switch (screen) {
    case 'dashboard':
      return <DashboardScreen {...commonProps} />
    case 'inventory':
      return <InventoryScreen {...commonProps} />
    case 'transactions':
      return <TransactionsScreen {...commonProps} />
    case 'categories':
      return <CategoriesScreen {...commonProps} />
    case 'suppliers':
      return <SuppliersScreen {...commonProps} />
    case 'itemSuppliers':
      return <ItemSupplierRelationsScreen {...commonProps} />
    case 'purchases':
      return <PurchaseOrdersScreen {...commonProps} />
    case 'sales':
      return <SalesOrdersScreen {...commonProps} />
    case 'users':
      return <UsersScreen {...commonProps} />
    case 'roles':
      return <RolesScreen {...commonProps} />
    case 'resources':
      return <ResourcesScreen {...commonProps} />
    default:
      return null
  }
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </AuthProvider>
  )
}
