<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { apiFetch, type PageResponse } from '@/lib/api'
import { authState, hasAuthority } from '@/lib/auth'
import { notifyError, notifySuccess } from '@/lib/notify'

type CategoryItem = {
  id: number
  code: string
  name: string
  description: string
}

const categories = ref<CategoryItem[]>([])
const keyword = ref('')
const loading = ref(false)
const page = reactive({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
const sortBy = ref('code')
const sortDir = ref<'asc' | 'desc'>('asc')
const editingId = ref<number | null>(null)
const showForm = ref(false)
const form = reactive({
  code: '',
  name: '',
  description: '',
})

const canWrite = computed(() => hasAuthority('CATEGORY_WRITE'))

async function loadPage(targetPage = page.page) {
  if (!authState.profile || !hasAuthority('CATEGORY_READ')) {
    categories.value = []
    return
  }

  loading.value = true
  try {
    const query = new URLSearchParams({
      keyword: keyword.value,
      page: String(targetPage),
      size: String(page.size),
      sortBy: sortBy.value,
      sortDir: sortDir.value,
    })
    const response = await apiFetch<PageResponse<CategoryItem>>(`/api/categories?${query.toString()}`)
    categories.value = response.content
    page.page = response.page
    page.size = response.size
    page.totalElements = response.totalElements
    page.totalPages = response.totalPages
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load categories.')
  } finally {
    loading.value = false
  }
}

function applyPageSize() {
  void loadPage(0)
}

function changeSort(field: string, initialDir: 'asc' | 'desc' = 'asc') {
  if (sortBy.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortDir.value = initialDir
  }

  void loadPage(0)
}

function sortIndicator(field: string) {
  if (sortBy.value !== field) {
    return ''
  }

  return sortDir.value === 'asc' ? '↑' : '↓'
}

function resetForm() {
  editingId.value = null
  form.code = ''
  form.name = ''
  form.description = ''
}

function startCreate() {
  resetForm()
  showForm.value = true
}

function startEdit(category: CategoryItem) {
  editingId.value = category.id
  form.code = category.code
  form.name = category.name
  form.description = category.description ?? ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  resetForm()
}

async function save() {
  const isCreate = editingId.value == null
  const payload = {
    code: form.code,
    name: form.name,
    description: form.description,
  }

  try {
    if (isCreate) {
      await apiFetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch(`/api/categories/${editingId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    closeForm()
    notifySuccess(isCreate ? 'create category success' : 'update category success')
    await loadPage()
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to save category.')
  }
}

async function remove(id: number) {
  try {
    await apiFetch(`/api/categories/${id}`, { method: 'DELETE' })
    notifySuccess('Category deleted.')
    await loadPage()
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to delete category.')
  }
}

onMounted(() => {
  void loadPage()
})

watch(
  () => authState.version,
  () => {
    void loadPage(0)
  },
)
</script>

<template>
  <section class="crud-card">
    <header class="page-header">
      <div>
        <p class="section-label">Inventory Management</p>
        <h2>Categories</h2>
      </div>
      <button v-if="canWrite" class="primary-btn" @click="startCreate">New Category</button>
    </header>

    <div class="toolbar">
      <input v-model="keyword" class="search-input" placeholder="Search by code or name" />
      <button class="secondary-btn" @click="loadPage(0)">Search</button>
    </div>

    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'code' }" @click="changeSort('code', 'asc')">
                <span>Code</span>
                <span class="sort-indicator">{{ sortIndicator('code') }}</span>
              </button>
            </th>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'name' }" @click="changeSort('name', 'asc')">
                <span>Name</span>
                <span class="sort-indicator">{{ sortIndicator('name') }}</span>
              </button>
            </th>
            <th>Description</th>
            <th v-if="canWrite">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.id">
            <td>{{ category.code }}</td>
            <td>{{ category.name }}</td>
            <td>{{ category.description }}</td>
            <td v-if="canWrite">
              <div class="row-actions">
                <button class="inline-btn" @click="startEdit(category)">Edit</button>
                <button class="inline-btn danger" @click="remove(category.id)">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && categories.length === 0">
            <td :colspan="canWrite ? 4 : 3" class="empty-cell">No categories found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <PaginationControls
      v-model:page="page.page"
      v-model:size="page.size"
      :total-elements="page.totalElements"
      :total-pages="page.totalPages"
      :disabled="loading"
      @go="loadPage"
      @size-change="applyPageSize"
    />
  </section>

  <div v-if="showForm" class="modal-backdrop" @click.self="closeForm">
    <section class="modal-card">
      <header class="modal-header">
        <div>
          <p class="section-label">Inventory Management</p>
          <h3>{{ editingId == null ? 'Create Category' : 'Edit Category' }}</h3>
        </div>
        <button class="inline-btn" @click="closeForm">Close</button>
      </header>

      <div class="editor-grid">
        <label><span>Code</span><input v-model="form.code" /></label>
        <label><span>Name</span><input v-model="form.name" /></label>
        <label class="full-width"><span>Description</span><input v-model="form.description" /></label>
      </div>

      <footer class="editor-actions">
        <button class="primary-btn" @click="save">{{ editingId == null ? 'Create' : 'Update' }}</button>
        <button class="secondary-btn" @click="closeForm">Cancel</button>
      </footer>
    </section>
  </div>
</template>
