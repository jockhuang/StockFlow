import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { Button, Card, ListRow, ModalForm, MultiSelectField, Paginator, Screen, SwitchField, TextField } from '../components/ui'
import { hasAuthority } from '../lib/permissions'
import type { SimpleOption, UserItem } from '../types'
import type { ScreenProps } from './common'

export function UsersScreen({ api, profile, onBack }: ScreenProps) {
  const [items, setItems] = useState<UserItem[]>([])
  const [roles, setRoles] = useState<SimpleOption[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<UserItem | null>(null)
  const [form, setForm] = useState({
    username: '',
    password: '',
    displayName: '',
    enabled: true,
    roleIds: [] as number[],
  })

  const canWrite = hasAuthority(profile, 'USER_WRITE')

  useEffect(() => {
    void bootstrap()
  }, [])

  async function bootstrap() {
    try {
      await Promise.all([loadRoles(), load(0)])
    } catch (error) {
      Alert.alert('Initialization Failed', error instanceof Error ? error.message : 'Unable to initialize users screen.')
    }
  }

  async function loadRoles() {
    setRoles(await api.listRoleOptions())
  }

  async function load(nextPage = page) {
    try {
      const response = await api.listUsers({
        keyword,
        page: nextPage,
        size: 12,
        sortBy: 'username',
        sortDir: 'asc',
      })
      setItems(response.content)
      setPage(response.page)
      setTotalPages(response.totalPages)
    } catch (error) {
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unable to load users.')
    }
  }

  function openCreate() {
    setEditing(null)
    setForm({ username: '', password: '', displayName: '', enabled: true, roleIds: [] })
    setShowForm(true)
  }

  function openEdit(item: UserItem) {
    setEditing(item)
    setForm({
      username: item.username,
      password: '',
      displayName: item.displayName,
      enabled: item.enabled,
      roleIds: item.roleIds,
    })
    setShowForm(true)
  }

  async function save() {
    try {
      if (!editing && !form.password.trim()) {
        throw new Error('Password is required when creating a user.')
      }
      const payload = {
        username: form.username,
        password: form.password,
        displayName: form.displayName,
        enabled: form.enabled,
        roleIds: form.roleIds,
      }
      if (editing) {
        await api.updateUser(editing.id, payload)
      } else {
        await api.createUser(payload)
      }
      setShowForm(false)
      await load(editing ? page : 0)
    } catch (error) {
      Alert.alert('Save Failed', error instanceof Error ? error.message : 'Unable to save user.')
    }
  }

  async function remove(id: number) {
    Alert.alert('Delete User', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void api
            .deleteUser(id)
            .then(() => load(page))
            .catch((error) => Alert.alert('Delete Failed', error instanceof Error ? error.message : 'Unable to delete user.'))
        },
      },
    ])
  }

  return (
    <Screen title="Users" subtitle="Permission Management" right={<Button label="Back" variant="secondary" onPress={onBack} />}>
      <Card title="Search" action={canWrite ? <Button label="New User" onPress={openCreate} /> : undefined}>
        <TextField label="Keyword" value={keyword} onChangeText={setKeyword} placeholder="Username or display name" />
        <Button label="Search" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="User List">
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.username} · ${item.displayName}`}
            subtitle={`Status: ${item.enabled ? 'Enabled' : 'Disabled'}`}
            meta={`Roles: ${item.roleCodes.join(', ')}`}
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
      <ModalForm visible={showForm} title={editing ? 'Edit User' : 'New User'} onClose={() => setShowForm(false)}>
        <Card>
          <TextField label="Username" value={form.username} onChangeText={(value) => setForm((prev) => ({ ...prev, username: value }))} />
          <TextField label="Password" value={form.password} onChangeText={(value) => setForm((prev) => ({ ...prev, password: value }))} secureTextEntry />
          <TextField label="Display Name" value={form.displayName} onChangeText={(value) => setForm((prev) => ({ ...prev, displayName: value }))} />
          <SwitchField label="Enabled" value={form.enabled} onValueChange={(value) => setForm((prev) => ({ ...prev, enabled: value }))} />
          <MultiSelectField
            label="Roles"
            value={form.roleIds}
            options={roles.map((item) => ({ label: `${item.code} · ${item.name}`, value: item.id }))}
            onChange={(value) => setForm((prev) => ({ ...prev, roleIds: value }))}
          />
          <Button label={editing ? 'Update User' : 'Create User'} onPress={() => void save()} />
        </Card>
      </ModalForm>
    </Screen>
  )
}
