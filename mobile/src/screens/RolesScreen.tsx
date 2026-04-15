import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { Button, Card, ListRow, ModalForm, MultiSelectField, Paginator, Screen, TextField } from '../components/ui'
import { hasAuthority } from '../lib/permissions'
import type { RoleItem, SimpleOption } from '../types'
import type { ScreenProps } from './common'

export function RolesScreen({ api, profile, onBack }: ScreenProps) {
  const [items, setItems] = useState<RoleItem[]>([])
  const [resources, setResources] = useState<SimpleOption[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<RoleItem | null>(null)
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    resourceIds: [] as number[],
  })

  const canWrite = hasAuthority(profile, 'ROLE_WRITE')

  useEffect(() => {
    void bootstrap()
  }, [])

  async function bootstrap() {
    try {
      await Promise.all([loadResources(), load(0)])
    } catch (error) {
      Alert.alert('Initialization Failed', error instanceof Error ? error.message : 'Unable to initialize roles screen.')
    }
  }

  async function loadResources() {
    setResources(await api.listResourceOptions())
  }

  async function load(nextPage = page) {
    try {
      const response = await api.listRoles({
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
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unable to load roles.')
    }
  }

  function openCreate() {
    setEditing(null)
    setForm({ code: '', name: '', description: '', resourceIds: [] })
    setShowForm(true)
  }

  function openEdit(item: RoleItem) {
    setEditing(item)
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      resourceIds: item.resourceIds,
    })
    setShowForm(true)
  }

  async function save() {
    try {
      const payload = {
        code: form.code,
        name: form.name,
        description: form.description,
        resourceIds: form.resourceIds,
      }
      if (editing) {
        await api.updateRole(editing.id, payload)
      } else {
        await api.createRole(payload)
      }
      setShowForm(false)
      await load(editing ? page : 0)
    } catch (error) {
      Alert.alert('Save Failed', error instanceof Error ? error.message : 'Unable to save role.')
    }
  }

  async function remove(id: number) {
    Alert.alert('Delete Role', 'Are you sure you want to delete this role?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void api
            .deleteRole(id)
            .then(() => load(page))
            .catch((error) => Alert.alert('Delete Failed', error instanceof Error ? error.message : 'Unable to delete role.'))
        },
      },
    ])
  }

  return (
    <Screen title="Roles" subtitle="Permission Management" right={<Button label="Back" variant="secondary" onPress={onBack} />}>
      <Card title="Search" action={canWrite ? <Button label="New Role" onPress={openCreate} /> : undefined}>
        <TextField label="Keyword" value={keyword} onChangeText={setKeyword} placeholder="Code or name" />
        <Button label="Search" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="Role List">
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.code} · ${item.name}`}
            subtitle={item.description || 'No description'}
            meta={item.resourceCodes.join(', ')}
            actions={
              canWrite ? (
                <>
                  <Button label="Edit" variant="secondary" onPress={() => openEdit(item)} />
                  <Button label="Delete" variant="danger" onPress={() => void remove(item.id)} />
                </>
              ) : undefined
            }
          />
        ))}
        <Paginator page={page} totalPages={totalPages} onPrev={() => void load(page - 1)} onNext={() => void load(page + 1)} />
      </Card>
      <ModalForm visible={showForm} title={editing ? 'Edit Role' : 'New Role'} onClose={() => setShowForm(false)}>
        <Card>
          <TextField label="Code" value={form.code} onChangeText={(value) => setForm((prev) => ({ ...prev, code: value }))} />
          <TextField label="Name" value={form.name} onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <TextField label="Description" value={form.description} onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))} multiline />
          <MultiSelectField
            label="Resources"
            value={form.resourceIds}
            options={resources.map((item) => ({ label: `${item.code} · ${item.name}`, value: item.id }))}
            onChange={(value) => setForm((prev) => ({ ...prev, resourceIds: value }))}
          />
          <Button label={editing ? 'Update Role' : 'Create Role'} onPress={() => void save()} />
        </Card>
      </ModalForm>
    </Screen>
  )
}
