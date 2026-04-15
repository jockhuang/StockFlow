import React, { useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { Button, Card, ListRow, ModalForm, PickerField, Paginator, Screen, TextField } from '../components/ui'
import { formatDateTime, formatMoney } from '../lib/format'
import type { InventoryItem, PurchaseOrder, SimpleOption } from '../types'
import type { ScreenProps } from './common'

export function PurchaseOrdersScreen({ api, onBack }: ScreenProps) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<SimpleOption[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    inventoryItemId: 0,
    supplierId: 0,
    quantity: '1',
    unitPrice: '',
    referenceNo: '',
    remark: '',
  })

  const selectedItem = useMemo(() => items.find((item) => item.id === form.inventoryItemId) ?? null, [items, form.inventoryItemId])
  const availableSuppliers = useMemo(
    () => suppliers.filter((supplier) => selectedItem?.supplierIds.includes(supplier.id)),
    [selectedItem, suppliers],
  )

  useEffect(() => {
    void bootstrap()
  }, [])

  async function bootstrap() {
    try {
      await Promise.all([loadInventoryOptions(), loadSupplierOptions(), load(0)])
    } catch (error) {
      Alert.alert('Initialization Failed', error instanceof Error ? error.message : 'Unable to initialize purchase orders screen.')
    }
  }

  async function loadInventoryOptions() {
    const response = await api.listInventory({ page: 0, size: 200, sortBy: 'sku', sortDir: 'asc' })
    setItems(response.content)
    setForm((prev) => ({ ...prev, inventoryItemId: prev.inventoryItemId || response.content[0]?.id || 0 }))
  }

  async function loadSupplierOptions() {
    setSuppliers(await api.listSupplierOptions())
  }

  async function load(nextPage = page) {
    try {
      const response = await api.listPurchaseOrders({
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
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unable to load purchase orders.')
    }
  }

  useEffect(() => {
    if (availableSuppliers[0] && !availableSuppliers.some((item) => item.id === form.supplierId)) {
      setForm((prev) => ({ ...prev, supplierId: availableSuppliers[0].id }))
    }
  }, [availableSuppliers])

  async function save() {
    try {
      await api.createPurchaseOrder({
        inventoryItemId: form.inventoryItemId,
        supplierId: form.supplierId,
        quantity: Number(form.quantity),
        unitPrice: form.unitPrice ? Number(form.unitPrice) : null,
        referenceNo: form.referenceNo || null,
        remark: form.remark || null,
      })
      setShowForm(false)
      await load(0)
    } catch (error) {
      Alert.alert('Create Failed', error instanceof Error ? error.message : 'Unable to create purchase order.')
    }
  }

  async function receive(id: number) {
    try {
      await api.receivePurchaseOrder(id)
      await load(page)
    } catch (error) {
      Alert.alert('Receive Failed', error instanceof Error ? error.message : 'Unable to receive purchase order.')
    }
  }

  return (
    <Screen title="Purchase Orders" subtitle="Procurement" right={<Button label="Back" variant="secondary" onPress={onBack} />}>
      <Card title="Purchase Order Search" action={<Button label="New Purchase Order" onPress={() => setShowForm(true)} />}>
        <TextField label="Keyword" value={keyword} onChangeText={setKeyword} placeholder="Item, supplier, or reference" />
        <Button label="Search" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="Purchase Order List">
        {orders.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.inventorySku} · ${item.inventoryName}`}
            subtitle={`Supplier ${item.supplierName} · Quantity ${item.quantity} · Unit Price ${formatMoney(item.unitPrice)}`}
            meta={`Status ${item.status} · Created ${formatDateTime(item.createdAt)} · Received ${formatDateTime(item.receivedAt)}`}
            actions={item.status !== 'RECEIVED' ? <Button label="Receive" onPress={() => void receive(item.id)} /> : undefined}
          />
        ))}
        <Paginator page={page} totalPages={totalPages} onPrev={() => void load(page - 1)} onNext={() => void load(page + 1)} />
      </Card>

      <ModalForm visible={showForm} title="New Purchase Order" onClose={() => setShowForm(false)}>
        <Card>
          <PickerField
            label="Item"
            value={form.inventoryItemId}
            options={items.map((item) => ({ label: `${item.sku} · ${item.name}`, value: item.id }))}
            onChange={(value) => setForm((prev) => ({ ...prev, inventoryItemId: value }))}
          />
          <PickerField
            label="Supplier"
            value={form.supplierId}
            options={availableSuppliers.map((item) => ({ label: `${item.code} · ${item.name}`, value: item.id }))}
            onChange={(value) => setForm((prev) => ({ ...prev, supplierId: value }))}
          />
          <TextField label="Quantity" value={form.quantity} onChangeText={(value) => setForm((prev) => ({ ...prev, quantity: value }))} keyboardType="numeric" />
          <TextField label="Unit Price" value={form.unitPrice} onChangeText={(value) => setForm((prev) => ({ ...prev, unitPrice: value }))} keyboardType="numeric" />
          <TextField label="Reference No" value={form.referenceNo} onChangeText={(value) => setForm((prev) => ({ ...prev, referenceNo: value }))} />
          <TextField label="Remark" value={form.remark} onChangeText={(value) => setForm((prev) => ({ ...prev, remark: value }))} multiline />
          <Button label="Create Purchase Order" onPress={() => void save()} />
        </Card>
      </ModalForm>
    </Screen>
  )
}
