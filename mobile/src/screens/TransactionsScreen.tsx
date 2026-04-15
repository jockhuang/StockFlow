import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { Button, Card, ListRow, PickerField, Paginator, Screen, TextField } from '../components/ui'
import { formatDateTime, formatMoney } from '../lib/format'
import type { SimpleOption, StockMovement } from '../types'
import type { ScreenProps } from './common'

const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '采购', value: 'PURCHASE' },
  { label: '销售', value: 'SALE' },
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
      Alert.alert('加载供应商失败', error instanceof Error ? error.message : 'Unable to load suppliers.')
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
      Alert.alert('加载流水失败', error instanceof Error ? error.message : 'Unable to load movements.')
    }
  }

  return (
    <Screen title="交易流水" subtitle="Purchase And Sales" right={<Button label="返回" variant="secondary" onPress={onBack} />}>
      <Card title="筛选">
        <TextField label="关键字" value={keyword} onChangeText={setKeyword} placeholder="SKU、商品、供应商、备注、单号" />
        <PickerField label="类型" value={type} options={typeOptions} onChange={setType} />
        <PickerField
          label="供应商"
          value={supplierId}
          options={[{ label: '全部供应商', value: 0 }, ...suppliers.map((item) => ({ label: `${item.code} · ${item.name}`, value: item.id }))]}
          onChange={setSupplierId}
        />
        <Button label="查询" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="流水列表">
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.inventorySku} · ${item.inventoryName}`}
            subtitle={`${item.type} · 数量 ${item.quantity} · 单价 ${formatMoney(item.unitPrice)}`}
            meta={`${formatDateTime(item.occurredAt)} · 供应商 ${item.supplierName || '-'} · 单号 ${item.referenceNo || '-'}`}
          />
        ))}
        <Paginator page={page} totalPages={totalPages} onPrev={() => void load(page - 1)} onNext={() => void load(page + 1)} />
      </Card>
    </Screen>
  )
}
