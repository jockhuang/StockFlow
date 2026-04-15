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
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unable to load categories.')
    }
  }

  async function loadSummary() {
    try {
      setSummary(await api.getInventorySummary())
    } catch (error) {
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unable to load inventory summary.')
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
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unable to load inventory items.')
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
      Alert.alert('Save Failed', error instanceof Error ? error.message : 'Unable to save inventory item.')
    }
  }

  async function deleteItem(id: number) {
    Alert.alert('Delete Item', 'Are you sure you want to delete this inventory item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void api
            .deleteInventoryItem(id)
            .then(() => Promise.all([load(page), loadSummary()]))
            .catch((error) => Alert.alert('Delete Failed', error instanceof Error ? error.message : 'Unable to delete inventory item.'))
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
      Alert.alert('Save Failed', error instanceof Error ? error.message : 'Unable to record stock movement.')
    }
  }

  return (
    <Screen
      title="Inventory"
      subtitle="Inventory"
      right={<Button label="Back" variant="secondary" onPress={onBack} />}
    >
      {summary ? (
        <Card title="Inventory Summary">
          <InlineStats
            stats={[
              { label: 'Items', value: String(summary.totalItems) },
              { label: 'On Hand', value: String(summary.totalOnHandQuantity) },
              { label: 'In Transit', value: String(summary.totalInTransitQuantity ?? 0) },
              { label: 'Committed', value: String(summary.totalCommittedQuantity ?? 0) },
            ]}
          />
          {canFinancial ? (
            <InlineStats
              stats={[
                { label: 'Inventory Cost', value: formatMoney(summary.totalInventoryCost) },
                { label: 'Sales Profit', value: formatMoney(summary.totalSalesProfit) },
              ]}
            />
          ) : null}
        </Card>
      ) : null}
      <Card title="Search" action={
        <>
          {canMovement ? <Button label="Stock Adjustment" variant="secondary" onPress={() => setShowMovementForm(true)} /> : null}
          {canWrite ? <Button label="New Item" onPress={openCreate} /> : null}
        </>
      }>
        <TextField label="Keyword" value={keyword} onChangeText={setKeyword} placeholder="SKU, name, location, or category" />
        <Button label="Search" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="Inventory List">
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.sku} · ${item.name}`}
            subtitle={`${item.categoryName} · ${item.location} · On Hand ${item.onHandQuantity} · Available ${item.availableQuantity}`}
            meta={
              canFinancial
                ? `Average Cost ${formatMoney(item.averageUnitCost)} · Inventory Cost ${formatMoney(item.inventoryCost)} · Updated ${formatDateTime(summary?.recentMovements?.[0]?.occurredAt)}`
                : `Suppliers ${item.supplierNames.join(', ') || '-'}`
            }
            actions={
              canWrite ? (
                <>
                  <Button label="Edit" variant="secondary" onPress={() => openEdit(item)} />
                  <Button label="Delete" variant="danger" onPress={() => void deleteItem(item.id)} />
                </>
              ) : undefined
            }
          />
        ))}
        <Paginator page={page} totalPages={totalPages} onPrev={() => void load(page - 1)} onNext={() => void load(page + 1)} />
      </Card>

      <ModalForm visible={showItemForm} title={editing ? 'Edit Item' : 'New Item'} onClose={() => setShowItemForm(false)}>
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
          <Button label={editing ? 'Update Item' : 'Create Item'} onPress={() => void saveItem()} />
        </Card>
      </ModalForm>

      <ModalForm visible={showMovementForm} title="Stock Adjustment" onClose={() => setShowMovementForm(false)}>
        <Card>
          <PickerField
            label="Item"
            value={movementForm.inventoryItemId}
            options={items.map((item) => ({ label: `${item.sku} · ${item.name}`, value: item.id }))}
            onChange={(value) => setMovementForm((prev) => ({ ...prev, inventoryItemId: value }))}
          />
          <PickerField
            label="Type"
            value={movementForm.type}
            options={[
              { label: 'Adjustment In', value: 'ADJUSTMENT_IN' },
              { label: 'Adjustment Out', value: 'ADJUSTMENT_OUT' },
            ]}
            onChange={(value) => setMovementForm((prev) => ({ ...prev, type: value }))}
          />
          <TextField label="Quantity" value={movementForm.quantity} onChangeText={(value) => setMovementForm((prev) => ({ ...prev, quantity: value }))} keyboardType="numeric" />
          <TextField label="Unit Price" value={movementForm.unitPrice} onChangeText={(value) => setMovementForm((prev) => ({ ...prev, unitPrice: value }))} keyboardType="numeric" />
          <TextField label="Reference No" value={movementForm.referenceNo} onChangeText={(value) => setMovementForm((prev) => ({ ...prev, referenceNo: value }))} />
          <TextField label="Partner Name" value={movementForm.partnerName} onChangeText={(value) => setMovementForm((prev) => ({ ...prev, partnerName: value }))} />
          <TextField label="Remark" value={movementForm.remark} onChangeText={(value) => setMovementForm((prev) => ({ ...prev, remark: value }))} multiline />
          <Button label="Submit Adjustment" onPress={() => void saveMovement()} />
        </Card>
      </ModalForm>
    </Screen>
  )
}
