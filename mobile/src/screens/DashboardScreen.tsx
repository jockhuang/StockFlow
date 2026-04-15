import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { Button, Card, InlineStats, ListRow, LoadingBlock, Screen } from '../components/ui'
import { formatDateTime, formatMoney } from '../lib/format'
import { hasAuthority } from '../lib/permissions'
import type { InventorySummary, SystemSummary } from '../types'
import type { ScreenProps } from './common'

export function DashboardScreen({ api, profile, onBack }: ScreenProps) {
  const [systemSummary, setSystemSummary] = useState<SystemSummary | null>(null)
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const tasks: Promise<void>[] = []
      if (hasAuthority(profile, 'SYSTEM_READ')) {
        tasks.push(api.getSystemSummary().then((value) => setSystemSummary(value)))
      }
      if (hasAuthority(profile, 'INVENTORY_READ')) {
        tasks.push(api.getInventorySummary().then((value) => setInventorySummary(value)))
      }
      await Promise.all(tasks)
    } catch (error) {
      Alert.alert('加载失败', error instanceof Error ? error.message : 'Unable to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen title="仪表盘" subtitle="系统概览" right={<Button label="返回" variant="secondary" onPress={onBack} />}>
      {loading ? <LoadingBlock /> : null}
      <Card title="当前用户">
        <ListRow title={profile.username} subtitle="已登录账号" meta={profile.authorities.join(', ')} />
      </Card>

      {systemSummary ? (
        <Card title="系统状态">
          <InlineStats
            stats={[
              { label: '应用', value: systemSummary.application },
              { label: '状态', value: systemSummary.status },
              { label: '时间', value: formatDateTime(systemSummary.timestamp) },
            ]}
          />
        </Card>
      ) : null}

      {inventorySummary ? (
        <Card title="库存摘要">
          <InlineStats
            stats={[
              { label: '商品数', value: String(inventorySummary.totalItems) },
              { label: '现货库存', value: String(inventorySummary.totalOnHandQuantity) },
              { label: '在途', value: String(inventorySummary.totalInTransitQuantity ?? 0) },
              { label: '已占用', value: String(inventorySummary.totalCommittedQuantity ?? 0) },
              { label: '可用库存', value: String(inventorySummary.totalAvailableQuantity ?? 0) },
              { label: '低库存项', value: String(inventorySummary.lowStockItems ?? 0) },
            ]}
          />
          {hasAuthority(profile, 'INVENTORY_FINANCIAL_READ') ? (
            <InlineStats
              stats={[
                { label: '库存成本', value: formatMoney(inventorySummary.totalInventoryCost) },
                { label: '销售利润', value: formatMoney(inventorySummary.totalSalesProfit) },
              ]}
            />
          ) : null}
        </Card>
      ) : null}

      {inventorySummary?.recentMovements?.length ? (
        <Card title="最新流水">
          {inventorySummary.recentMovements.slice(0, 5).map((movement) => (
            <ListRow
              key={movement.id}
              title={`${movement.inventorySku} · ${movement.inventoryName}`}
              subtitle={`${movement.type} · 数量 ${movement.quantity}`}
              meta={formatDateTime(movement.occurredAt)}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  )
}
