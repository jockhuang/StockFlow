import React from 'react'
import { Text, View } from 'react-native'
import type { UserProfile } from '../types'
import { hasAuthority, hasAnyAuthority } from '../lib/permissions'
import { Button, Card, ListRow, Screen, styles } from '../components/ui'

export type AppScreenKey =
  | 'dashboard'
  | 'inventory'
  | 'transactions'
  | 'categories'
  | 'suppliers'
  | 'itemSuppliers'
  | 'purchases'
  | 'sales'
  | 'users'
  | 'roles'
  | 'resources'

const modules: Array<{
  key: AppScreenKey
  title: string
  subtitle: string
  authority: string[]
}> = [
  { key: 'dashboard', title: 'Dashboard', subtitle: 'System and inventory overview', authority: ['SYSTEM_READ', 'INVENTORY_READ'] },
  { key: 'inventory', title: 'Inventory', subtitle: 'Items, stock, and adjustments', authority: ['INVENTORY_READ'] },
  { key: 'transactions', title: 'Transactions', subtitle: 'Purchase and sales movement history', authority: ['INVENTORY_READ', 'INVENTORY_MOVEMENT_READ'] },
  { key: 'categories', title: 'Categories', subtitle: 'Category maintenance', authority: ['CATEGORY_READ'] },
  { key: 'suppliers', title: 'Suppliers', subtitle: 'Supplier maintenance', authority: ['SUPPLIER_READ'] },
  { key: 'itemSuppliers', title: 'Item Supplier Relations', subtitle: 'Manage allowed purchase suppliers', authority: ['ITEM_SUPPLIER_RELATION_READ'] },
  { key: 'purchases', title: 'Purchase Orders', subtitle: 'Create and receive orders', authority: ['PURCHASE_ORDER_READ'] },
  { key: 'sales', title: 'Sales Orders', subtitle: 'Create and ship orders', authority: ['SALES_ORDER_READ'] },
  { key: 'users', title: 'Users', subtitle: 'Accounts and roles', authority: ['USER_READ'] },
  { key: 'roles', title: 'Roles', subtitle: 'Role and resource assignment', authority: ['ROLE_READ'] },
  { key: 'resources', title: 'Resources', subtitle: 'API resource maintenance', authority: ['RESOURCE_READ'] },
]

export function HomeScreen({
  profile,
  baseUrl,
  onOpen,
  onSignOut,
}: {
  profile: UserProfile
  baseUrl: string
  onOpen: (screen: AppScreenKey) => void
  onSignOut: () => void
}) {
  const visibleModules = modules.filter((item) => hasAnyAuthority(profile, item.authority))

  return (
    <Screen title="StockFlow Mobile" subtitle="Warehouse Mobile App" right={<Button label="Sign Out" variant="secondary" onPress={onSignOut} />}>
      <Card title="Current Session">
        <View style={{ gap: 6 }}>
          <Text style={styles.helper}>User: {profile.username}</Text>
          <Text style={styles.helper}>Server: {baseUrl}</Text>
          <Text style={styles.helper}>Authorities: {profile.authorities.length}</Text>
        </View>
      </Card>

      <Card title="Modules">
        {visibleModules.map((item) => (
          <ListRow
            key={item.key}
            title={item.title}
            subtitle={item.subtitle}
            meta={item.authority.filter((authority) => hasAuthority(profile, authority)).join(' / ')}
            actions={<Button label="Open" onPress={() => onOpen(item.key)} />}
          />
        ))}
      </Card>
    </Screen>
  )
}
