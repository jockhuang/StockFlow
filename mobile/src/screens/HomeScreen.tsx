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
  { key: 'dashboard', title: '仪表盘', subtitle: '系统与库存摘要', authority: ['SYSTEM_READ', 'INVENTORY_READ'] },
  { key: 'inventory', title: '库存', subtitle: '商品、库存与调整', authority: ['INVENTORY_READ'] },
  { key: 'transactions', title: '交易流水', subtitle: '采购/销售出入库记录', authority: ['INVENTORY_READ', 'INVENTORY_MOVEMENT_READ'] },
  { key: 'categories', title: '分类', subtitle: '分类维护', authority: ['CATEGORY_READ'] },
  { key: 'suppliers', title: '供应商', subtitle: '供应商维护', authority: ['SUPPLIER_READ'] },
  { key: 'itemSuppliers', title: '商品供应商关系', subtitle: '维护可采购供应商', authority: ['ITEM_SUPPLIER_RELATION_READ'] },
  { key: 'purchases', title: '采购单', subtitle: '创建与收货', authority: ['PURCHASE_ORDER_READ'] },
  { key: 'sales', title: '销售单', subtitle: '创建与发货', authority: ['SALES_ORDER_READ'] },
  { key: 'users', title: '用户', subtitle: '账号与角色', authority: ['USER_READ'] },
  { key: 'roles', title: '角色', subtitle: '角色与资源授权', authority: ['ROLE_READ'] },
  { key: 'resources', title: '资源', subtitle: '接口资源维护', authority: ['RESOURCE_READ'] },
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
    <Screen title="StockFlow Mobile" subtitle="仓储移动端" right={<Button label="退出登录" variant="secondary" onPress={onSignOut} />}>
      <Card title="当前会话">
        <View style={{ gap: 6 }}>
          <Text style={styles.helper}>用户：{profile.username}</Text>
          <Text style={styles.helper}>服务：{baseUrl}</Text>
          <Text style={styles.helper}>权限数：{profile.authorities.length}</Text>
        </View>
      </Card>

      <Card title="业务模块">
        {visibleModules.map((item) => (
          <ListRow
            key={item.key}
            title={item.title}
            subtitle={item.subtitle}
            meta={item.authority.filter((authority) => hasAuthority(profile, authority)).join(' / ')}
            actions={<Button label="进入" onPress={() => onOpen(item.key)} />}
          />
        ))}
      </Card>
    </Screen>
  )
}
