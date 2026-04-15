import React, { useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { Button, Card, ListRow, MultiSelectField, Paginator, Screen, TextField } from '../components/ui'
import type { InventoryItem, SimpleOption } from '../types'
import type { ScreenProps } from './common'

export function ItemSupplierRelationsScreen({ api, onBack }: ScreenProps) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<SimpleOption[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedItemId, setSelectedItemId] = useState(0)
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<number[]>([])

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedItemId) ?? null, [items, selectedItemId])

  useEffect(() => {
    void Promise.all([loadSuppliers(), load(0)])
  }, [])

  async function loadSuppliers() {
    try {
      setSuppliers(await api.listSupplierOptions())
    } catch (error) {
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unable to load suppliers.')
    }
  }

  async function load(nextPage = page) {
    try {
      const response = await api.listInventorySupplierRelations({
        keyword,
        page: nextPage,
        size: 10,
        sortBy: 'sku',
        sortDir: 'asc',
      })
      setItems(response.content)
      setPage(response.page)
      setTotalPages(response.totalPages)
      const nextSelected = response.content.find((item) => item.id === selectedItemId) ?? response.content[0]
      setSelectedItemId(nextSelected?.id ?? 0)
      setSelectedSupplierIds(nextSelected?.supplierIds ?? [])
    } catch (error) {
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unable to load item supplier relations.')
    }
  }

  async function save() {
    if (!selectedItem) {
      return
    }
    try {
      await api.updateSupplierRelations(selectedItem.id, selectedSupplierIds)
      await load(page)
    } catch (error) {
      Alert.alert('Save Failed', error instanceof Error ? error.message : 'Unable to save item supplier relations.')
    }
  }

  return (
    <Screen title="Item Supplier Relations" subtitle="Inventory Management" right={<Button label="Back" variant="secondary" onPress={onBack} />}>
      <Card title="Item Search">
        <TextField label="Keyword" value={keyword} onChangeText={setKeyword} placeholder="SKU, name, location, or category" />
        <Button label="Search" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="Item List">
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.sku} · ${item.name}`}
            subtitle={`${item.categoryName} · ${item.location}`}
            meta={item.id === selectedItemId ? 'Currently selected' : item.supplierNames.join(', ') || 'No suppliers assigned'}
            actions={<Button label="Select" variant={item.id === selectedItemId ? 'primary' : 'secondary'} onPress={() => {
              setSelectedItemId(item.id)
              setSelectedSupplierIds(item.supplierIds)
            }} />}
          />
        ))}
        <Paginator page={page} totalPages={totalPages} onPrev={() => void load(page - 1)} onNext={() => void load(page + 1)} />
      </Card>
      <Card title={selectedItem ? `${selectedItem.sku} · ${selectedItem.name}` : 'Relation Editor'}>
        <MultiSelectField
          label="Allowed Suppliers"
          value={selectedSupplierIds}
          options={suppliers.map((item) => ({ label: `${item.code} · ${item.name}`, value: item.id }))}
          onChange={setSelectedSupplierIds}
        />
        <Button label="Save Relations" onPress={() => void save()} />
      </Card>
    </Screen>
  )
}
