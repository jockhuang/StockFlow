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
      Alert.alert('加载供应商失败', error instanceof Error ? error.message : 'Unable to load suppliers.')
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
      Alert.alert('保存供应商失败', error instanceof Error ? error.message : 'Unable to save supplier.')
    }
  }

  async function remove(id: number) {
    Alert.alert('删除供应商', '确认删除该供应商？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          void api
            .deleteSupplier(id)
            .then(() => load(page))
            .catch((error) => Alert.alert('删除供应商失败', error instanceof Error ? error.message : 'Unable to delete.'))
        },
      },
    ])
  }

  return (
    <Screen title="供应商" subtitle="Inventory Management" right={<Button label="返回" variant="secondary" onPress={onBack} />}>
      <Card title="搜索" action={canWrite ? <Button label="新建" onPress={openCreate} /> : undefined}>
        <TextField label="关键字" value={keyword} onChangeText={setKeyword} placeholder="编码、名称、联系人、电话" />
        <Button label="查询" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="供应商列表">
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.code} · ${item.name}`}
            subtitle={`联系人：${item.contactPerson || '-'} · 电话：${item.phone || '-'}`}
            meta={`商品：${formatList(item.inventoryItemNames)}`}
            actions={
              canWrite ? (
                <>
                  <Button label="编辑" variant="secondary" onPress={() => openEdit(item)} />
                  <Button label="删除" variant="danger" onPress={() => remove(item.id)} />
                </>
              ) : undefined
            }
          />
        ))}
        <Paginator page={page} totalPages={totalPages} onPrev={() => void load(page - 1)} onNext={() => void load(page + 1)} />
      </Card>

      <ModalForm visible={showForm} title={editing ? '编辑供应商' : '新建供应商'} onClose={() => setShowForm(false)}>
        <Card>
          <TextField label="Code" value={form.code} onChangeText={(value) => setForm((prev) => ({ ...prev, code: value }))} />
          <TextField label="Name" value={form.name} onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <TextField label="Contact Person" value={form.contactPerson} onChangeText={(value) => setForm((prev) => ({ ...prev, contactPerson: value }))} />
          <TextField label="Phone" value={form.phone} onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
          <TextField label="Email" value={form.email} onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))} keyboardType="email-address" />
          <TextField label="Address" value={form.address} onChangeText={(value) => setForm((prev) => ({ ...prev, address: value }))} multiline />
          <TextField label="Description" value={form.description} onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))} multiline />
          <Button label={editing ? '更新' : '创建'} onPress={() => void save()} />
        </Card>
      </ModalForm>
    </Screen>
  )
}
