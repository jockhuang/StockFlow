<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { apiFetch, type PageResponse } from '@/lib/api'
import { authState, hasAuthority } from '@/lib/auth'
import { notifyError, notifySuccess } from '@/lib/notify'

type ResourceItem = {
  id: number
  code: string
  name: string
  path: string
  httpMethod: string
  description: string
}

const resources = ref<ResourceItem[]>([])
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
  path: '',
  httpMethod: 'GET',
  description: '',
})

const canWrite = computed(() => hasAuthority('RESOURCE_WRITE'))

async function loadPage(targetPage = page.page) {
  if (!authState.profile || !hasAuthority('RESOURCE_READ')) {
    resources.value = []
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
    const response = await apiFetch<PageResponse<ResourceItem>>(`/api/resources?${query.toString()}`)
    resources.value = response.content
    page.page = response.page
    page.size = response.size
    page.totalElements = response.totalElements
    page.totalPages = response.totalPages
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load resources.')
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
  form.path = ''
  form.httpMethod = 'GET'
  form.description = ''
}

function startCreate() {
  resetForm()
  showForm.value = true
}

function startEdit(resource: ResourceItem) {
  editingId.value = resource.id
  form.code = resource.code
  form.name = resource.name
  form.path = resource.path
  form.httpMethod = resource.httpMethod
  form.description = resource.description ?? ''
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
    path: form.path,
    httpMethod: form.httpMethod,
    description: form.description,
  }

  try {
    if (isCreate) {
      await apiFetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch(`/api/resources/${editingId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    showForm.value = false
    resetForm()
    notifySuccess(isCreate ? 'create resource success' : 'update resource success')
    await loadPage()
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to save resource.')
  }
}

async function remove(id: number) {
  try {
    await apiFetch(`/api/resources/${id}`, { method: 'DELETE' })
    notifySuccess('Resource deleted.')
    await loadPage()
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to delete resource.')
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
        <p class="section-label">Permission Management</p>
        <h2>Resources</h2>
      </div>
      <button v-if="canWrite" class="primary-btn" @click="startCreate">New Resource</button>
    </header>

    <div class="toolbar">
      <input v-model="keyword" class="search-input" placeholder="Search by code, name, or path" />
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
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'httpMethod' }" @click="changeSort('httpMethod', 'asc')">
                <span>Method</span>
                <span class="sort-indicator">{{ sortIndicator('httpMethod') }}</span>
              </button>
            </th>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'path' }" @click="changeSort('path', 'asc')">
                <span>Path</span>
                <span class="sort-indicator">{{ sortIndicator('path') }}</span>
              </button>
            </th>
            <th>Description</th>
            <th v-if="canWrite">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="resource in resources" :key="resource.id">
            <td>{{ resource.code }}</td>
            <td>{{ resource.name }}</td>
            <td>{{ resource.httpMethod }}</td>
            <td>{{ resource.path }}</td>
            <td>{{ resource.description }}</td>
            <td v-if="canWrite">
              <div class="row-actions">
                <button class="inline-btn" @click="startEdit(resource)">Edit</button>
                <button class="inline-btn danger" @click="remove(resource.id)">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && resources.length === 0">
            <td :colspan="canWrite ? 6 : 5" class="empty-cell">No resources found.</td>
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
    <section class="modal-card modal-card-wide">
      <header class="modal-header">
        <div>
          <p class="section-label">Permission Management</p>
          <h3>{{ editingId == null ? 'Create Resource' : 'Edit Resource' }}</h3>
        </div>
        <button class="inline-btn" @click="closeForm">Close</button>
      </header>

      <div class="editor-grid wide">
        <label><span>Code</span><input v-model="form.code" /></label>
        <label><span>Name</span><input v-model="form.name" /></label>
        <label><span>HTTP Method</span><input v-model="form.httpMethod" /></label>
        <label class="full-width"><span>Path</span><input v-model="form.path" /></label>
        <label class="full-width"><span>Description</span><input v-model="form.description" /></label>
      </div>

      <footer class="editor-actions">
        <button class="primary-btn" @click="save">{{ editingId == null ? 'Create' : 'Update' }}</button>
        <button class="secondary-btn" @click="closeForm">Cancel</button>
      </footer>
    </section>
  </div>
</template>
