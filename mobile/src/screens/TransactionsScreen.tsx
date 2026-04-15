import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { Button, Card, ListRow, PickerField, Paginator, Screen, TextField } from '../components/ui'
import { formatDateTime, formatMoney } from '../lib/format'
import type { SimpleOption, StockMovement } from '../types'
import type { ScreenProps } from './common'

const typeOptions = [
  { label: 'All Types', value: '' },
  { label: 'Purchase', value: 'PURCHASE' },
  { label: 'Sale', value: 'SALE' },
]

export function TransactionsScreen({ api, onBack }: ScreenProps) {
  const [items, setItems] = useState<StockMovement[]>([])
  const [suppliers, setSuppliers] = useState<SimpleOption[]>([])
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState('')
  const [supplierId, setSupplierId] = useState(0)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    void Promise.all([loadSuppliers(), load(0)])
  }, [])

  async function loadSuppliers() {
    try {
      const options = await api.listSupplierOptions()
      setSuppliers(options)
    } catch (error) {
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unable to load suppliers.')
    }
  }

  async function load(nextPage = page) {
    try {
      const response = await api.listMovements({
        keyword,
        type,
        supplierId: supplierId || undefined,
        page: nextPage,
        size: 12,
        sortBy: 'occurredAt',
        sortDir: 'desc',
      })
      setItems(response.content)
      setPage(response.page)
      setTotalPages(response.totalPages)
    } catch (error) {
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unable to load movements.')
    }
  }

  return (
    <Screen title="Transactions" subtitle="Purchase And Sales" right={<Button label="Back" variant="secondary" onPress={onBack} />}>
      <Card title="Filters">
        <TextField label="Keyword" value={keyword} onChangeText={setKeyword} placeholder="SKU, item, supplier, remark, or reference" />
        <PickerField label="Type" value={type} options={typeOptions} onChange={setType} />
        <PickerField
          label="Supplier"
          value={supplierId}
          options={[{ label: 'All Suppliers', value: 0 }, ...suppliers.map((item) => ({ label: `${item.code} · ${item.name}`, value: item.id }))]}
          onChange={setSupplierId}
        />
        <Button label="Search" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="Movement List">
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.inventorySku} · ${item.inventoryName}`}
            subtitle={`${item.type} · Quantity ${item.quantity} · Unit Price ${formatMoney(item.unitPrice)}`}
            meta={`${formatDateTime(item.occurredAt)} · Supplier ${item.supplierName || '-'} · Reference ${item.referenceNo || '-'}`}
          />
        ))}
        <Paginator page={page} totalPages={totalPages} onPrev={() => void load(page - 1)} onNext={() => void load(page + 1)} />
      </Card>
    </Screen>
  )
}
