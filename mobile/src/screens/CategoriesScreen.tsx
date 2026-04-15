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
      Alert.alert('加载分类失败', error instanceof Error ? error.message : 'Unable to load categories.')
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
      Alert.alert('保存分类失败', error instanceof Error ? error.message : 'Unable to save category.')
    }
  }

  async function remove(id: number) {
    Alert.alert('删除分类', '确认删除该分类？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          void api
            .deleteCategory(id)
            .then(() => load(page))
            .catch((error) => Alert.alert('删除分类失败', error instanceof Error ? error.message : 'Unable to delete.'))
        },
      },
    ])
  }

  return (
    <Screen title="分类" subtitle="Inventory Management" right={<Button label="返回" variant="secondary" onPress={onBack} />}>
      <Card title="搜索" action={canWrite ? <Button label="新建" onPress={openCreate} /> : undefined}>
        <TextField label="关键字" value={keyword} onChangeText={setKeyword} placeholder="按编码或名称搜索" />
        <Button label="查询" variant="secondary" onPress={() => void load(0)} />
      </Card>

      <Card title="分类列表">
        {items.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.code} · ${item.name}`}
            subtitle={item.description || '无描述'}
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

      <ModalForm visible={showForm} title={editing ? '编辑分类' : '新建分类'} onClose={() => setShowForm(false)}>
        <Card>
          <TextField label="Code" value={code} onChangeText={setCode} />
          <TextField label="Name" value={name} onChangeText={setName} />
          <TextField label="Description" value={description} onChangeText={setDescription} multiline />
          <Button label={editing ? '更新' : '创建'} onPress={() => void save()} />
        </Card>
      </ModalForm>
    </Screen>
  )
}
