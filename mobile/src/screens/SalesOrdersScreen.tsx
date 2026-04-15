import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { Button, Card, ListRow, ModalForm, PickerField, Paginator, Screen, TextField } from '../components/ui'
import { formatDateTime, formatMoney } from '../lib/format'
import type { InventoryItem, SalesOrder } from '../types'
import type { ScreenProps } from './common'

export function SalesOrdersScreen({ api, onBack }: ScreenProps) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    inventoryItemId: 0,
    quantity: '1',
    unitPrice: '',
    customerName: '',
    referenceNo: '',
    remark: '',
  })

  useEffect(() => {
    void bootstrap()
  }, [])

  async function bootstrap() {
    try {
      await Promise.all([loadInventoryOptions(), load(0)])
    } catch (error) {
      Alert.alert('初始化失败', error instanceof Error ? error.message : 'Unable to initialize sales orders screen.')
    }
  }

  async function loadInventoryOptions() {
    const response = await api.listInventory({ page: 0, size: 200, sortBy: 'sku', sortDir: 'asc' })
    setItems(response.content)
    setForm((prev) => ({ ...prev, inventoryItemId: prev.inventoryItemId || response.content[0]?.id || 0 }))
  }

  async function load(nextPage = page) {
    try {
      const response = await api.listSalesOrders({
        keyword,
        page: nextPage,
        size: 12,
        sortBy: 'createdAt',
        sortDir: 'desc',
      })
      setOrders(response.content)
      setPage(response.page)
      setTotalPages(response.totalPages)
    } catch (error) {
      Alert.alert('加载销售单失败', error instanceof Error ? error.message : 'Unable to load sales orders.')
    }
  }

  async function save() {
    try {
      await api.createSalesOrder({
        inventoryItemId: form.inventoryItemId,
        quantity: Number(form.quantity),
        unitPrice: form.unitPrice ? Number(form.unitPrice) : null,
        customerName: form.customerName || null,
        referenceNo: form.referenceNo || null,
        remark: form.remark || null,
      })
      setShowForm(false)
      await Promise.all([loadInventoryOptions(), load(0)])
    } catch (error) {
      Alert.alert('创建销售单失败', error instanceof Error ? error.message : 'Unable to create sales order.')
    }
  }

  async function ship(id: number) {
    try {
      await api.shipSalesOrder(id)
      await Promise.all([loadInventoryOptions(), load(page)])
    } catch (error) {
      Alert.alert('发货失败', error instanceof Error ? error.message : 'Unable to ship sales order.')
    }
  }

  return (
    <Screen title="销售单" subtitle="Sales" right={<Button label="返回" variant="secondary" onPress={onBack} />}>
      <Card title="销售单搜索" action={<Button label="新建销售单" onPress={() => setShowForm(true)} />}>
        <TextField label="关键字" value={keyword} onChangeText={setKeyword} placeholder="商品、客户、单号" />
        <Button label="查询" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="销售单列表">
        {orders.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.inventorySku} · ${item.inventoryName}`}
            subtitle={`客户 ${item.customerName || '-'} · 数量 ${item.quantity} · 单价 ${formatMoney(item.unitPrice)}`}
            meta={`状态 ${item.status} · 创建 ${formatDateTime(item.createdAt)} · 发货 ${formatDateTime(item.shippedAt)}`}
            actions={item.status !== 'SHIPPED' ? <Button label="确认发货" onPress={() => void ship(item.id)} /> : undefined}
          />
        ))}
        <Paginator page={page} totalPages={totalPages} onPrev={() => void load(page - 1)} onNext={() => void load(page + 1)} />
      </Card>

      <ModalForm visible={showForm} title="新建销售单" onClose={() => setShowForm(false)}>
        <Card>
          <PickerField
            label="商品"
            value={form.inventoryItemId}
            options={items.map((item) => ({ label: `${item.sku} · ${item.name} · 可用 ${item.availableQuantity}`, value: item.id }))}
            onChange={(value) => setForm((prev) => ({ ...prev, inventoryItemId: value }))}
          />
          <TextField label="数量" value={form.quantity} onChangeText={(value) => setForm((prev) => ({ ...prev, quantity: value }))} keyboardType="numeric" />
          <TextField label="单价" value={form.unitPrice} onChangeText={(value) => setForm((prev) => ({ ...prev, unitPrice: value }))} keyboardType="numeric" />
          <TextField label="Customer Name" value={form.customerName} onChangeText={(value) => setForm((prev) => ({ ...prev, customerName: value }))} />
          <TextField label="Reference No" value={form.referenceNo} onChangeText={(value) => setForm((prev) => ({ ...prev, referenceNo: value }))} />
          <TextField label="Remark" value={form.remark} onChangeText={(value) => setForm((prev) => ({ ...prev, remark: value }))} multiline />
          <Button label="创建销售单" onPress={() => void save()} />
        </Card>
      </ModalForm>
    </Screen>
  )
}
