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
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unable to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen title="Dashboard" subtitle="System Overview" right={<Button label="Back" variant="secondary" onPress={onBack} />}>
      {loading ? <LoadingBlock /> : null}
      <Card title="Current User">
        <ListRow title={profile.username} subtitle="Signed-in account" meta={profile.authorities.join(', ')} />
      </Card>

      {systemSummary ? (
        <Card title="System Status">
          <InlineStats
            stats={[
              { label: 'Application', value: systemSummary.application },
              { label: 'Status', value: systemSummary.status },
              { label: 'Timestamp', value: formatDateTime(systemSummary.timestamp) },
            ]}
          />
        </Card>
      ) : null}

      {inventorySummary ? (
        <Card title="Inventory Summary">
          <InlineStats
            stats={[
              { label: 'Items', value: String(inventorySummary.totalItems) },
              { label: 'On Hand', value: String(inventorySummary.totalOnHandQuantity) },
              { label: 'In Transit', value: String(inventorySummary.totalInTransitQuantity ?? 0) },
              { label: 'Committed', value: String(inventorySummary.totalCommittedQuantity ?? 0) },
              { label: 'Available', value: String(inventorySummary.totalAvailableQuantity ?? 0) },
              { label: 'Low Stock', value: String(inventorySummary.lowStockItems ?? 0) },
            ]}
          />
          {hasAuthority(profile, 'INVENTORY_FINANCIAL_READ') ? (
            <InlineStats
              stats={[
                { label: 'Inventory Cost', value: formatMoney(inventorySummary.totalInventoryCost) },
                { label: 'Sales Profit', value: formatMoney(inventorySummary.totalSalesProfit) },
              ]}
            />
          ) : null}
        </Card>
      ) : null}

      {inventorySummary?.recentMovements?.length ? (
        <Card title="Recent Movements">
          {inventorySummary.recentMovements.slice(0, 5).map((movement) => (
            <ListRow
              key={movement.id}
              title={`${movement.inventorySku} · ${movement.inventoryName}`}
              subtitle={`${movement.type} · Quantity ${movement.quantity}`}
              meta={formatDateTime(movement.occurredAt)}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  )
}
