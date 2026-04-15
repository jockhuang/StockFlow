import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import {
  Button,
  Card,
  InlineStats,
  ListRow,
  ModalForm,
  PickerField,
  Paginator,
  Screen,
  TextField,
} from '../components/ui'
import { formatDateTime, formatMoney } from '../lib/format'
import { hasAuthority } from '../lib/permissions'
import type { InventoryItem, InventorySummary, SimpleOption } from '../types'
import type { ScreenProps } from './common'

export function InventoryScreen({ api, profile, onBack }: ScreenProps) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [categories, setCategories] = useState<SimpleOption[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showItemForm, setShowItemForm] = useState(false)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [itemForm, setItemForm] = useState({
    sku: '',
    name: '',
    quantity: '0',
    location: '',
    categoryId: 0,
    supplierIds: [] as number[],
  })
  const [movementForm, setMovementForm] = useState({
    inventoryItemId: 0,
    supplierId: 0,
    type: 'ADJUSTMENT_IN',
    quantity: '1',
    unitPrice: '',
    referenceNo: '',
    partnerName: '',
    remark: '',
  })

  const canWrite = hasAuthority(profile, 'INVENTORY_WRITE')
  const canMovement = hasAuthority(profile, 'INVENTORY_MOVEMENT_WRITE') || hasAuthority(profile, 'INVENTORY_WRITE')
  const canFinancial = hasAuthority(profile, 'INVENTORY_FINANCIAL_READ')

  useEffect(() => {
    void Promise.all([loadCategories(), loadSummary(), load(0)])
  }, [])

  async function loadCategories() {
    try {
      const options = await api.listCategoryOptions()
      setCategories(options)
      setItemForm((prev) => ({ ...prev, categoryId: prev.categoryId || options[0]?.id || 0 }))
    } catch (error) {
      Alert.alert('加载分类失败', error instanceof Error ? error.message : 'Unable to load categories.')
    }
  }

  async function loadSummary() {
    try {
      setSummary(await api.getInventorySummary())
    } catch (error) {
      Alert.alert('加载摘要失败', error instanceof Error ? error.message : 'Unable to load inventory summary.')
    }
  }

  async function load(nextPage = page) {
    try {
      const response = await api.listInventory({
        keyword,
        page: nextPage,
        size: 10,
        sortBy: 'sku',
        sortDir: 'asc',
      })
      setItems(response.content)
      setPage(response.page)
      setTotalPages(response.totalPages)
      setMovementForm((prev) => ({ ...prev, inventoryItemId: prev.inventoryItemId || response.content[0]?.id || 0 }))
    } catch (error) {
      Alert.alert('加载库存失败', error instanceof Error ? error.message : 'Unable to load inventory items.')
    }
  }

  function openCreate() {
    setEditing(null)
    setItemForm({
      sku: '',
      name: '',
      quantity: '0',
      location: '',
      categoryId: categories[0]?.id || 0,
      supplierIds: [],
    })
    setShowItemForm(true)
  }

  function openEdit(item: InventoryItem) {
    setEditing(item)
    setItemForm({
      sku: item.sku,
      name: item.name,
      quantity: String(item.quantity),
      location: item.location,
      categoryId: item.categoryId,
      supplierIds: item.supplierIds,
    })
    setShowItemForm(true)
  }

  async function saveItem() {
    try {
      const payload = {
        sku: itemForm.sku,
        name: itemForm.name,
        quantity: Number(itemForm.quantity),
        location: itemForm.location,
        categoryId: itemForm.categoryId,
        supplierIds: itemForm.supplierIds,
      }
      if (editing) {
        await api.updateInventoryItem(editing.id, payload)
      } else {
        await api.createInventoryItem(payload)
      }
      setShowItemForm(false)
      await Promise.all([load(editing ? page : 0), loadSummary()])
    } catch (error) {
      Alert.alert('保存商品失败', error instanceof Error ? error.message : 'Unable to save inventory item.')
    }
  }

  async function deleteItem(id: number) {
    Alert.alert('删除商品', '确认删除该库存商品？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          void api
            .deleteInventoryItem(id)
            .then(() => Promise.all([load(page), loadSummary()]))
            .catch((error) => Alert.alert('删除失败', error instanceof Error ? error.message : 'Unable to delete inventory item.'))
        },
      },
    ])
  }

  async function saveMovement() {
    try {
      await api.recordMovement({
        inventoryItemId: movementForm.inventoryItemId,
        supplierId: movementForm.supplierId || null,
        type: movementForm.type,
        quantity: Number(movementForm.quantity),
        unitPrice: movementForm.unitPrice ? Number(movementForm.unitPrice) : null,
        referenceNo: movementForm.referenceNo || null,
        partnerName: movementForm.partnerName || null,
        remark: movementForm.remark || null,
      })
      setShowMovementForm(false)
      await Promise.all([load(page), loadSummary()])
    } catch (error) {
      Alert.alert('记录流水失败', error instanceof Error ? error.message : 'Unable to record stock movement.')
    }
  }

  return (
    <Screen
      title="库存"
      subtitle="Inventory"
      right={<Button label="返回" variant="secondary" onPress={onBack} />}
    >
      {summary ? (
        <Card title="库存摘要">
          <InlineStats
            stats={[
              { label: '商品数', value: String(summary.totalItems) },
              { label: '现货', value: String(summary.totalOnHandQuantity) },
              { label: '在途', value: String(summary.totalInTransitQuantity ?? 0) },
              { label: '占用', value: String(summary.totalCommittedQuantity ?? 0) },
            ]}
          />
          {canFinancial ? (
            <InlineStats
              stats={[
                { label: '库存成本', value: formatMoney(summary.totalInventoryCost) },
                { label: '销售利润', value: formatMoney(summary.totalSalesProfit) },
              ]}
            />
          ) : null}
        </Card>
      ) : null}
      <Card title="搜索" action={
        <>
          {canMovement ? <Button label="库存调整" variant="secondary" onPress={() => setShowMovementForm(true)} /> : null}
          {canWrite ? <Button label="新建商品" onPress={openCreate} /> : null}
        </>
      }>
        <TextField label="关键字" value={keyword} onChangeText={setKeyword} placeholder="SKU、名称、库位、分类" />
        <Button label="查询" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="库存列表">
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.sku} · ${item.name}`}
            subtitle={`${item.categoryName} · ${item.location} · 现货 ${item.onHandQuantity} · 可用 ${item.availableQuantity}`}
            meta={
              canFinancial
                ? `平均成本 ${formatMoney(item.averageUnitCost)} · 库存成本 ${formatMoney(item.inventoryCost)} · 更新时间 ${formatDateTime(summary?.recentMovements?.[0]?.occurredAt)}`
                : `供应商 ${item.supplierNames.join(', ') || '-'}`
            }
            actions={
              canWrite ? (
                <>
                  <Button label="编辑" variant="secondary" onPress={() => openEdit(item)} />
                  <Button label="删除" variant="danger" onPress={() => void deleteItem(item.id)} />
                </>
              ) : undefined
            }
          />
        ))}
        <Paginator page={page} totalPages={totalPages} onPrev={() => void load(page - 1)} onNext={() => void load(page + 1)} />
      </Card>

      <ModalForm visible={showItemForm} title={editing ? '编辑商品' : '新建商品'} onClose={() => setShowItemForm(false)}>
        <Card>
          <TextField label="SKU" value={itemForm.sku} onChangeText={(value) => setItemForm((prev) => ({ ...prev, sku: value }))} />
          <TextField label="Name" value={itemForm.name} onChangeText={(value) => setItemForm((prev) => ({ ...prev, name: value }))} />
          <TextField label={editing ? 'Current Stock' : 'Opening Stock'} value={itemForm.quantity} onChangeText={(value) => setItemForm((prev) => ({ ...prev, quantity: value }))} keyboardType="numeric" />
          <TextField label="Location" value={itemForm.location} onChangeText={(value) => setItemForm((prev) => ({ ...prev, location: value }))} />
          <PickerField
            label="Category"
            value={itemForm.categoryId}
            options={categories.map((item) => ({ label: `${item.code} · ${item.name}`, value: item.id }))}
            onChange={(value) => setItemForm((prev) => ({ ...prev, categoryId: value }))}
          />
          <Button label={editing ? '更新商品' : '创建商品'} onPress={() => void saveItem()} />
        </Card>
      </ModalForm>

      <ModalForm visible={showMovementForm} title="库存调整" onClose={() => setShowMovementForm(false)}>
        <Card>
          <PickerField
            label="商品"
            value={movementForm.inventoryItemId}
            options={items.map((item) => ({ label: `${item.sku} · ${item.name}`, value: item.id }))}
            onChange={(value) => setMovementForm((prev) => ({ ...prev, inventoryItemId: value }))}
          />
          <PickerField
            label="类型"
            value={movementForm.type}
            options={[
              { label: 'Adjustment In', value: 'ADJUSTMENT_IN' },
              { label: 'Adjustment Out', value: 'ADJUSTMENT_OUT' },
            ]}
            onChange={(value) => setMovementForm((prev) => ({ ...prev, type: value }))}
          />
          <TextField label="数量" value={movementForm.quantity} onChangeText={(value) => setMovementForm((prev) => ({ ...prev, quantity: value }))} keyboardType="numeric" />
          <TextField label="单价" value={movementForm.unitPrice} onChangeText={(value) => setMovementForm((prev) => ({ ...prev, unitPrice: value }))} keyboardType="numeric" />
          <TextField label="Reference No" value={movementForm.referenceNo} onChangeText={(value) => setMovementForm((prev) => ({ ...prev, referenceNo: value }))} />
          <TextField label="Partner Name" value={movementForm.partnerName} onChangeText={(value) => setMovementForm((prev) => ({ ...prev, partnerName: value }))} />
          <TextField label="Remark" value={movementForm.remark} onChangeText={(value) => setMovementForm((prev) => ({ ...prev, remark: value }))} multiline />
          <Button label="提交调整" onPress={() => void saveMovement()} />
        </Card>
      </ModalForm>
    </Screen>
  )
}
