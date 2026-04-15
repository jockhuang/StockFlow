import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { Button, Card, ListRow, ModalForm, Paginator, Screen, TextField } from '../components/ui'
import { hasAuthority } from '../lib/permissions'
import type { Category } from '../types'
import type { ScreenProps } from './common'

export function CategoriesScreen({ api, profile, onBack }: ScreenProps) {
  const [items, setItems] = useState<Category[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [editing, setEditing] = useState<Category | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const canWrite = hasAuthority(profile, 'CATEGORY_WRITE')

  useEffect(() => {
    void load(0)
  }, [])

  function resetForm() {
    setEditing(null)
    setCode('')
    setName('')
    setDescription('')
  }

  async function load(nextPage = page) {
    try {
      const response = await api.listCategories({
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
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unable to load categories.')
    }
  }

  function openCreate() {
    resetForm()
    setShowForm(true)
  }

  function openEdit(item: Category) {
    setEditing(item)
    setCode(item.code)
    setName(item.name)
    setDescription(item.description ?? '')
    setShowForm(true)
  }

  async function save() {
    try {
      const payload = { code, name, description }
      if (editing) {
        await api.updateCategory(editing.id, payload)
      } else {
        await api.createCategory(payload)
      }
      setShowForm(false)
      resetForm()
      await load(editing ? page : 0)
    } catch (error) {
      Alert.alert('Save Failed', error instanceof Error ? error.message : 'Unable to save category.')
    }
  }

  async function remove(id: number) {
    Alert.alert('Delete Category', 'Are you sure you want to delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void api
            .deleteCategory(id)
            .then(() => load(page))
            .catch((error) => Alert.alert('Delete Failed', error instanceof Error ? error.message : 'Unable to delete.'))
        },
      },
    ])
  }

  return (
    <Screen title="Categories" subtitle="Inventory Management" right={<Button label="Back" variant="secondary" onPress={onBack} />}>
      <Card title="Search" action={canWrite ? <Button label="New" onPress={openCreate} /> : undefined}>
        <TextField label="Keyword" value={keyword} onChangeText={setKeyword} placeholder="Search by code or name" />
        <Button label="Search" variant="secondary" onPress={() => void load(0)} />
      </Card>

      <Card title="Category List">
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.code} · ${item.name}`}
            subtitle={item.description || 'No description'}
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

      <ModalForm visible={showForm} title={editing ? 'Edit Category' : 'New Category'} onClose={() => setShowForm(false)}>
        <Card>
          <TextField label="Code" value={code} onChangeText={setCode} />
          <TextField label="Name" value={name} onChangeText={setName} />
          <TextField label="Description" value={description} onChangeText={setDescription} multiline />
          <Button label={editing ? 'Update' : 'Create'} onPress={() => void save()} />
        </Card>
      </ModalForm>
    </Screen>
  )
}
