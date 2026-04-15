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
      Alert.alert('Initialization Failed', error instanceof Error ? error.message : 'Unable to initialize sales orders screen.')
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
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unable to load sales orders.')
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
      Alert.alert('Create Failed', error instanceof Error ? error.message : 'Unable to create sales order.')
    }
  }

  async function ship(id: number) {
    try {
      await api.shipSalesOrder(id)
      await Promise.all([loadInventoryOptions(), load(page)])
    } catch (error) {
      Alert.alert('Ship Failed', error instanceof Error ? error.message : 'Unable to ship sales order.')
    }
  }

  return (
    <Screen title="Sales Orders" subtitle="Sales" right={<Button label="Back" variant="secondary" onPress={onBack} />}>
      <Card title="Sales Order Search" action={<Button label="New Sales Order" onPress={() => setShowForm(true)} />}>
        <TextField label="Keyword" value={keyword} onChangeText={setKeyword} placeholder="Item, customer, or reference" />
        <Button label="Search" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="Sales Order List">
        {orders.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.inventorySku} · ${item.inventoryName}`}
            subtitle={`Customer ${item.customerName || '-'} · Quantity ${item.quantity} · Unit Price ${formatMoney(item.unitPrice)}`}
            meta={`Status ${item.status} · Created ${formatDateTime(item.createdAt)} · Shipped ${formatDateTime(item.shippedAt)}`}
            actions={item.status !== 'SHIPPED' ? <Button label="Ship" onPress={() => void ship(item.id)} /> : undefined}
          />
        ))}
        <Paginator page={page} totalPages={totalPages} onPrev={() => void load(page - 1)} onNext={() => void load(page + 1)} />
      </Card>

      <ModalForm visible={showForm} title="New Sales Order" onClose={() => setShowForm(false)}>
        <Card>
          <PickerField
            label="Item"
            value={form.inventoryItemId}
            options={items.map((item) => ({ label: `${item.sku} · ${item.name} · Available ${item.availableQuantity}`, value: item.id }))}
            onChange={(value) => setForm((prev) => ({ ...prev, inventoryItemId: value }))}
          />
          <TextField label="Quantity" value={form.quantity} onChangeText={(value) => setForm((prev) => ({ ...prev, quantity: value }))} keyboardType="numeric" />
          <TextField label="Unit Price" value={form.unitPrice} onChangeText={(value) => setForm((prev) => ({ ...prev, unitPrice: value }))} keyboardType="numeric" />
          <TextField label="Customer Name" value={form.customerName} onChangeText={(value) => setForm((prev) => ({ ...prev, customerName: value }))} />
          <TextField label="Reference No" value={form.referenceNo} onChangeText={(value) => setForm((prev) => ({ ...prev, referenceNo: value }))} />
          <TextField label="Remark" value={form.remark} onChangeText={(value) => setForm((prev) => ({ ...prev, remark: value }))} multiline />
          <Button label="Create Sales Order" onPress={() => void save()} />
        </Card>
      </ModalForm>
    </Screen>
  )
}
