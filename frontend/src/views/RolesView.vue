<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { apiFetch, type PageResponse } from '@/lib/api'
import { authState, hasAuthority } from '@/lib/auth'
import { notifyError, notifySuccess } from '@/lib/notify'

type RoleItem = {
  id: number
  code: string
  name: string
  description: string
  resourceIds: number[]
  resourceCodes: string[]
}

type ResourceOption = {
  id: number
  code: string
  name: string
}

type ResourceGroup = {
  label: string
  items: ResourceOption[]
}

const roles = ref<RoleItem[]>([])
const resources = ref<ResourceOption[]>([])
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
  resourceIds: [] as number[],
})

const canWrite = computed(() => hasAuthority('ROLE_WRITE'))

const groupOrder = [
  'Dashboard',
  'Inventory',
  'Item Suppliers',
  'Purchases',
  'Sales',
  'Transactions',
  'Suppliers',
  'Categories',
  'Users',
  'Roles',
  'Resources',
  'Authentication',
  'Other',
] as const

const resourceGroups = computed<ResourceGroup[]>(() => {
  const groups = new Map<string, ResourceOption[]>()

  for (const resource of [...resources.value].sort(compareResources)) {
    const group = resourceGroupLabel(resource.code)
    const items = groups.get(group) ?? []
    items.push(resource)
    groups.set(group, items)
  }

  return groupOrder
    .map((label) => ({ label, items: groups.get(label) ?? [] }))
    .filter((group) => group.items.length > 0)
})

async function loadResources() {
  if (!authState.profile || !hasAuthority('RESOURCE_READ')) {
    resources.value = []
    return
  }

  resources.value = await apiFetch<ResourceOption[]>('/api/resources/options')
}

async function loadPage(targetPage = page.page) {
  if (!authState.profile || !hasAuthority('ROLE_READ')) {
    roles.value = []
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
    const response = await apiFetch<PageResponse<RoleItem>>(`/api/roles?${query.toString()}`)
    roles.value = response.content
    page.page = response.page
    page.size = response.size
    page.totalElements = response.totalElements
    page.totalPages = response.totalPages
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load roles.')
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
  form.resourceIds = []
}

function startCreate() {
  resetForm()
  showForm.value = true
}

function startEdit(role: RoleItem) {
  editingId.value = role.id
  form.code = role.code
  form.name = role.name
  form.description = role.description ?? ''
  form.resourceIds = [...role.resourceIds]
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
    resourceIds: form.resourceIds,
  }

  try {
    if (isCreate) {
      await apiFetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch(`/api/roles/${editingId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    showForm.value = false
    resetForm()
    notifySuccess(isCreate ? 'create role success' : 'update role success')
    await loadPage()
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to save role.')
  }
}

async function remove(id: number) {
  try {
    await apiFetch(`/api/roles/${id}`, { method: 'DELETE' })
    notifySuccess('Role deleted.')
    await loadPage()
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to delete role.')
  }
}

onMounted(() => {
  void Promise.all([loadResources(), loadPage()])
})

watch(
  () => authState.version,
  () => {
    void Promise.all([loadResources(), loadPage(0)])
  },
)

function resourceGroupLabel(code: string) {
  if (code.startsWith('SYSTEM_')) return 'Dashboard'
  if (code.startsWith('INVENTORY_')) return 'Inventory'
  if (code.startsWith('ITEM_SUPPLIER_RELATION_')) return 'Item Suppliers'
  if (code.startsWith('PURCHASE_ORDER_')) return 'Purchases'
  if (code.startsWith('SALES_ORDER_')) return 'Sales'
  if (code.startsWith('SUPPLIER_')) return 'Suppliers'
  if (code.startsWith('CATEGORY_')) return 'Categories'
  if (code.startsWith('USER_')) return 'Users'
  if (code.startsWith('ROLE_')) return 'Roles'
  if (code.startsWith('RESOURCE_')) return 'Resources'
  if (code.startsWith('AUTH_')) return 'Authentication'
  if (code.startsWith('INVENTORY_MOVEMENT_')) return 'Transactions'
  return 'Other'
}

function compareResources(a: ResourceOption, b: ResourceOption) {
  return resourceSortKey(a.code).localeCompare(resourceSortKey(b.code)) || a.code.localeCompare(b.code)
}

function resourceSortKey(code: string) {
  if (code.endsWith('_READ')) return `${code}:1`
  if (code.endsWith('_WRITE')) return `${code}:2`
  return `${code}:9`
}
</script>

<template>
  <section class="crud-card">
    <header class="page-header">
      <div>
        <p class="section-label">Permission Management</p>
        <h2>Roles</h2>
      </div>
      <button v-if="canWrite" class="primary-btn" @click="startCreate">New Role</button>
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
            <th>Resources</th>
            <th v-if="canWrite">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in roles" :key="role.id">
            <td>{{ role.code }}</td>
            <td>{{ role.name }}</td>
            <td>{{ role.description }}</td>
            <td>{{ role.resourceCodes.join(', ') }}</td>
            <td v-if="canWrite">
              <div class="row-actions">
                <button class="inline-btn" @click="startEdit(role)">Edit</button>
                <button class="inline-btn danger" @click="remove(role.id)">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && roles.length === 0">
            <td :colspan="canWrite ? 5 : 4" class="empty-cell">No roles found.</td>
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
          <h3>{{ editingId == null ? 'Create Role' : 'Edit Role' }}</h3>
        </div>
        <button class="inline-btn" @click="closeForm">Close</button>
      </header>

      <div class="editor-grid wide">
        <label><span>Code</span><input v-model="form.code" /></label>
        <label><span>Name</span><input v-model="form.name" /></label>
        <label class="full-width"><span>Description</span><input v-model="form.description" /></label>
        <label class="full-width">
          <span>Resources</span>
          <div class="resource-groups">
            <section v-for="group in resourceGroups" :key="group.label" class="resource-group">
              <h4>{{ group.label }}</h4>
              <div class="checkbox-grid">
                <label v-for="resource in group.items" :key="resource.id" class="check-item">
                  <input v-model="form.resourceIds" :value="resource.id" type="checkbox" />
                  <span>{{ resource.code }} · {{ resource.name }}</span>
                </label>
              </div>
            </section>
          </div>
        </label>
      </div>

      <footer class="editor-actions">
        <button class="primary-btn" @click="save">{{ editingId == null ? 'Create' : 'Update' }}</button>
        <button class="secondary-btn" @click="closeForm">Cancel</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.resource-groups {
  display: grid;
  gap: 14px;
}

.resource-group {
  display: grid;
  gap: 8px;
}

.resource-group h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
}
</style>
