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
      Alert.alert('初始化失败', error instanceof Error ? error.message : 'Unable to initialize roles screen.')
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
      Alert.alert('加载角色失败', error instanceof Error ? error.message : 'Unable to load roles.')
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
      Alert.alert('保存角色失败', error instanceof Error ? error.message : 'Unable to save role.')
    }
  }

  async function remove(id: number) {
    Alert.alert('删除角色', '确认删除该角色？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          void api
            .deleteRole(id)
            .then(() => load(page))
            .catch((error) => Alert.alert('删除角色失败', error instanceof Error ? error.message : 'Unable to delete role.'))
        },
      },
    ])
  }

  return (
    <Screen title="角色" subtitle="Permission Management" right={<Button label="返回" variant="secondary" onPress={onBack} />}>
      <Card title="搜索" action={canWrite ? <Button label="新建角色" onPress={openCreate} /> : undefined}>
        <TextField label="关键字" value={keyword} onChangeText={setKeyword} placeholder="编码或名称" />
        <Button label="查询" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="角色列表">
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.code} · ${item.name}`}
            subtitle={item.description || '无描述'}
            meta={item.resourceCodes.join(', ')}
            actions={
              canWrite ? (
                <>
                  <Button label="编辑" variant="secondary" onPress={() => openEdit(item)} />
                  <Button label="删除" variant="danger" onPress={() => void remove(item.id)} />
                </>
              ) : undefined
            }
          />
        ))}
        <Paginator page={page} totalPages={totalPages} onPrev={() => void load(page - 1)} onNext={() => void load(page + 1)} />
      </Card>
      <ModalForm visible={showForm} title={editing ? '编辑角色' : '新建角色'} onClose={() => setShowForm(false)}>
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
          <Button label={editing ? '更新角色' : '创建角色'} onPress={() => void save()} />
        </Card>
      </ModalForm>
    </Screen>
  )
}
