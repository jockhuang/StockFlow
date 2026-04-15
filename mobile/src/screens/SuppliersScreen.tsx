import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { Button, Card, ListRow, ModalForm, Paginator, Screen, TextField } from '../components/ui'
import { formatList } from '../lib/format'
import { hasAuthority } from '../lib/permissions'
import type { Supplier } from '../types'
import type { ScreenProps } from './common'

export function SuppliersScreen({ api, profile, onBack }: ScreenProps) {
  const [items, setItems] = useState<Supplier[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    description: '',
  })

  const canWrite = hasAuthority(profile, 'SUPPLIER_WRITE')

  useEffect(() => {
    void load(0)
  }, [])

  function resetForm() {
    setEditing(null)
    setForm({
      code: '',
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      description: '',
    })
  }

  async function load(nextPage = page) {
    try {
      const response = await api.listSuppliers({
        keyword,
        page: nextPage,
        size: 12,
        sortBy: 'code',
        sortDir: 'asc',
      })
      setItems(response.content)
      setPage(response.page)
      setTotalPages(response.totalPages)
    } catch (error) {
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unable to load suppliers.')
    }
  }

  function openCreate() {
    resetForm()
    setShowForm(true)
  }

  function openEdit(item: Supplier) {
    setEditing(item)
    setForm({
      code: item.code,
      name: item.name,
      contactPerson: item.contactPerson ?? '',
      phone: item.phone ?? '',
      email: item.email ?? '',
      address: item.address ?? '',
      description: item.description ?? '',
    })
    setShowForm(true)
  }

  async function save() {
    try {
      const payload = {
        ...form,
        contactPerson: form.contactPerson || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        description: form.description || null,
        inventoryItemIds: [],
      }
      if (editing) {
        await api.updateSupplier(editing.id, payload)
      } else {
        await api.createSupplier(payload)
      }
      setShowForm(false)
      resetForm()
      await load(editing ? page : 0)
    } catch (error) {
      Alert.alert('Save Failed', error instanceof Error ? error.message : 'Unable to save supplier.')
    }
  }

  async function remove(id: number) {
    Alert.alert('Delete Supplier', 'Are you sure you want to delete this supplier?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void api
            .deleteSupplier(id)
            .then(() => load(page))
            .catch((error) => Alert.alert('Delete Failed', error instanceof Error ? error.message : 'Unable to delete.'))
        },
      },
    ])
  }

  return (
    <Screen title="Suppliers" subtitle="Inventory Management" right={<Button label="Back" variant="secondary" onPress={onBack} />}>
      <Card title="Search" action={canWrite ? <Button label="New" onPress={openCreate} /> : undefined}>
        <TextField label="Keyword" value={keyword} onChangeText={setKeyword} placeholder="Code, name, contact, or phone" />
        <Button label="Search" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="Supplier List">
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.code} · ${item.name}`}
            subtitle={`Contact: ${item.contactPerson || '-'} · Phone: ${item.phone || '-'}`}
            meta={`Items: ${formatList(item.inventoryItemNames)}`}
            actions={
              canWrite ? (
                <>
                  <Button label="Edit" variant="secondary" onPress={() => openEdit(item)} />
                  <Button label="Delete" variant="danger" onPress={() => remove(item.id)} />
                </>
              ) : undefined
            }
          />
        ))}
        <Paginator page={page} totalPages={totalPages} onPrev={() => void load(page - 1)} onNext={() => void load(page + 1)} />
      </Card>

      <ModalForm visible={showForm} title={editing ? 'Edit Supplier' : 'New Supplier'} onClose={() => setShowForm(false)}>
        <Card>
          <TextField label="Code" value={form.code} onChangeText={(value) => setForm((prev) => ({ ...prev, code: value }))} />
          <TextField label="Name" value={form.name} onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <TextField label="Contact Person" value={form.contactPerson} onChangeText={(value) => setForm((prev) => ({ ...prev, contactPerson: value }))} />
          <TextField label="Phone" value={form.phone} onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
          <TextField label="Email" value={form.email} onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))} keyboardType="email-address" />
          <TextField label="Address" value={form.address} onChangeText={(value) => setForm((prev) => ({ ...prev, address: value }))} multiline />
          <TextField label="Description" value={form.description} onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))} multiline />
          <Button label={editing ? 'Update' : 'Create'} onPress={() => void save()} />
        </Card>
      </ModalForm>
    </Screen>
  )
}
