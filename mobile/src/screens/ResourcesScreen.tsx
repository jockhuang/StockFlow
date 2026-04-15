import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { Button, Card, ListRow, ModalForm, Paginator, Screen, TextField } from '../components/ui'
import { hasAuthority } from '../lib/permissions'
import type { ResourceItem } from '../types'
import type { ScreenProps } from './common'

export function ResourcesScreen({ api, profile, onBack }: ScreenProps) {
  const [items, setItems] = useState<ResourceItem[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ResourceItem | null>(null)
  const [form, setForm] = useState({
    code: '',
    name: '',
    path: '',
    httpMethod: 'GET',
    description: '',
  })

  const canWrite = hasAuthority(profile, 'RESOURCE_WRITE')

  useEffect(() => {
    void load(0)
  }, [])

  async function load(nextPage = page) {
    try {
      const response = await api.listResources({
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
      Alert.alert('加载资源失败', error instanceof Error ? error.message : 'Unable to load resources.')
    }
  }

  function openCreate() {
    setEditing(null)
    setForm({ code: '', name: '', path: '', httpMethod: 'GET', description: '' })
    setShowForm(true)
  }

  function openEdit(item: ResourceItem) {
    setEditing(item)
    setForm({
      code: item.code,
      name: item.name,
      path: item.path,
      httpMethod: item.httpMethod,
      description: item.description ?? '',
    })
    setShowForm(true)
  }

  async function save() {
    try {
      const payload = { ...form }
      if (editing) {
        await api.updateResource(editing.id, payload)
      } else {
        await api.createResource(payload)
      }
      setShowForm(false)
      await load(editing ? page : 0)
    } catch (error) {
      Alert.alert('保存资源失败', error instanceof Error ? error.message : 'Unable to save resource.')
    }
  }

  async function remove(id: number) {
    Alert.alert('删除资源', '确认删除该资源？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          void api
            .deleteResource(id)
            .then(() => load(page))
            .catch((error) => Alert.alert('删除资源失败', error instanceof Error ? error.message : 'Unable to delete resource.'))
        },
      },
    ])
  }

  return (
    <Screen title="资源" subtitle="Permission Management" right={<Button label="返回" variant="secondary" onPress={onBack} />}>
      <Card title="搜索" action={canWrite ? <Button label="新建资源" onPress={openCreate} /> : undefined}>
        <TextField label="关键字" value={keyword} onChangeText={setKeyword} placeholder="编码、名称、路径" />
        <Button label="查询" variant="secondary" onPress={() => void load(0)} />
      </Card>
      <Card title="资源列表">
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.code} · ${item.name}`}
            subtitle={`${item.httpMethod} ${item.path}`}
            meta={item.description || '无描述'}
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

      <ModalForm visible={showForm} title={editing ? '编辑资源' : '新建资源'} onClose={() => setShowForm(false)}>
        <Card>
          <TextField label="Code" value={form.code} onChangeText={(value) => setForm((prev) => ({ ...prev, code: value }))} />
          <TextField label="Name" value={form.name} onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <TextField label="HTTP Method" value={form.httpMethod} onChangeText={(value) => setForm((prev) => ({ ...prev, httpMethod: value }))} />
          <TextField label="Path" value={form.path} onChangeText={(value) => setForm((prev) => ({ ...prev, path: value }))} />
          <TextField label="Description" value={form.description} onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))} multiline />
          <Button label={editing ? '更新资源' : '创建资源'} onPress={() => void save()} />
        </Card>
      </ModalForm>
    </Screen>
  )
}
