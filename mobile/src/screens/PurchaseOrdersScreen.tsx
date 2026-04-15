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
      Alert.alert('初始化失败', error instanceof Error ? error.message : 'Unable to initialize purchase orders screen.')
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
      Alert.alert('加载采购单失败', error instanceof Error ? error.message : 'Unable to load purchase orders.')
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
      Alert.alert('创建采购单失败', error instanceof Error ? error.message : 'Unable to create purchase order.')
    }
  }

  async function receive(id: number) {
    try {
      await api.receivePurchaseOrder(id)
      await load(page)
    } catch (error) {
      Alert.alert('收货失败', error instanceof Error ? error.message : 'Unable to receive purchase order.')
    }
  }

  return (
    <Screen title="采购单" subtitle="Procurement" right={<Button label="返回" variant="secondary" onPress={onBack} />}>
      <Card title="采购单搜索" action={<Button label="新建采购单" onPress={() => setShowForm(true)} />}>
        <TextField label="关键字" value={keyword} onChangeText={setKeyword} placeholder="商品、供应商、单号" />
        <Button label="查询" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="采购单列表">
        {orders.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.inventorySku} · ${item.inventoryName}`}
            subtitle={`供应商 ${item.supplierName} · 数量 ${item.quantity} · 单价 ${formatMoney(item.unitPrice)}`}
            meta={`状态 ${item.status} · 创建 ${formatDateTime(item.createdAt)} · 收货 ${formatDateTime(item.receivedAt)}`}
            actions={item.status !== 'RECEIVED' ? <Button label="确认收货" onPress={() => void receive(item.id)} /> : undefined}
          />
        ))}
        <Paginator page={page} totalPages={totalPages} onPrev={() => void load(page - 1)} onNext={() => void load(page + 1)} />
      </Card>

      <ModalForm visible={showForm} title="新建采购单" onClose={() => setShowForm(false)}>
        <Card>
          <PickerField
            label="商品"
            value={form.inventoryItemId}
            options={items.map((item) => ({ label: `${item.sku} · ${item.name}`, value: item.id }))}
            onChange={(value) => setForm((prev) => ({ ...prev, inventoryItemId: value }))}
          />
          <PickerField
            label="供应商"
            value={form.supplierId}
            options={availableSuppliers.map((item) => ({ label: `${item.code} · ${item.name}`, value: item.id }))}
            onChange={(value) => setForm((prev) => ({ ...prev, supplierId: value }))}
          />
          <TextField label="数量" value={form.quantity} onChangeText={(value) => setForm((prev) => ({ ...prev, quantity: value }))} keyboardType="numeric" />
          <TextField label="单价" value={form.unitPrice} onChangeText={(value) => setForm((prev) => ({ ...prev, unitPrice: value }))} keyboardType="numeric" />
          <TextField label="Reference No" value={form.referenceNo} onChangeText={(value) => setForm((prev) => ({ ...prev, referenceNo: value }))} />
          <TextField label="Remark" value={form.remark} onChangeText={(value) => setForm((prev) => ({ ...prev, remark: value }))} multiline />
          <Button label="创建采购单" onPress={() => void save()} />
        </Card>
      </ModalForm>
    </Screen>
  )
}
