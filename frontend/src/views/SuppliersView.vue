<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { apiFetch, type PageResponse } from '@/lib/api'
import { authState, hasAuthority } from '@/lib/auth'
import { notifyError, notifySuccess } from '@/lib/notify'

type Supplier = {
  id: number
  code: string
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  description: string | null
  inventoryItemIds: number[]
  inventoryItemNames: string[]
}

const suppliers = ref<Supplier[]>([])
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
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  description: '',
})

const canWrite = computed(() => hasAuthority('SUPPLIER_WRITE'))

async function loadPage(targetPage = page.page) {
  if (!authState.profile || !hasAuthority('SUPPLIER_READ')) {
    suppliers.value = []
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
    const response = await apiFetch<PageResponse<Supplier>>(`/api/suppliers?${query.toString()}`)
    suppliers.value = response.content
    page.page = response.page
    page.size = response.size
    page.totalElements = response.totalElements
    page.totalPages = response.totalPages
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load suppliers.')
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
  form.contactPerson = ''
  form.phone = ''
  form.email = ''
  form.address = ''
  form.description = ''
}

function startCreate() {
  resetForm()
  showForm.value = true
}

function startEdit(supplier: Supplier) {
  editingId.value = supplier.id
  form.code = supplier.code
  form.name = supplier.name
  form.contactPerson = supplier.contactPerson ?? ''
  form.phone = supplier.phone ?? ''
  form.email = supplier.email ?? ''
  form.address = supplier.address ?? ''
  form.description = supplier.description ?? ''
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
    contactPerson: form.contactPerson || null,
    phone: form.phone || null,
    email: form.email || null,
    address: form.address || null,
    description: form.description || null,
    inventoryItemIds: [],
  }

  try {
    if (isCreate) {
      await apiFetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch(`/api/suppliers/${editingId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    closeForm()
    notifySuccess(isCreate ? 'create supplier success' : 'update supplier success')
    await loadPage()
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to save supplier.')
  }
}

async function remove(id: number) {
  try {
    await apiFetch(`/api/suppliers/${id}`, { method: 'DELETE' })
    notifySuccess('delete supplier success')
    await loadPage()
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to delete supplier.')
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
        <h2>Suppliers</h2>
      </div>
      <button v-if="canWrite" class="primary-btn" @click="startCreate">New Supplier</button>
    </header>

    <div class="toolbar">
      <input v-model="keyword" class="search-input" placeholder="Search by code, name, contact, phone, email" />
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
              <button class="sort-button" :class="{ active: sortBy === 'contactPerson' }" @click="changeSort('contactPerson', 'asc')">
                <span>Contact</span>
                <span class="sort-indicator">{{ sortIndicator('contactPerson') }}</span>
              </button>
            </th>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'phone' }" @click="changeSort('phone', 'asc')">
                <span>Phone</span>
                <span class="sort-indicator">{{ sortIndicator('phone') }}</span>
              </button>
            </th>
            <th>Items</th>
            <th v-if="canWrite">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="supplier in suppliers" :key="supplier.id">
            <td>{{ supplier.code }}</td>
            <td>{{ supplier.name }}</td>
            <td>{{ supplier.contactPerson || '-' }}</td>
            <td>{{ supplier.phone || '-' }}</td>
            <td>{{ supplier.inventoryItemNames.join(', ') || '-' }}</td>
            <td v-if="canWrite">
              <div class="row-actions">
                <button class="inline-btn" @click="startEdit(supplier)">Edit</button>
                <button class="inline-btn danger" @click="remove(supplier.id)">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && suppliers.length === 0">
            <td :colspan="canWrite ? 6 : 5" class="empty-cell">No suppliers found.</td>
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
          <p class="section-label">Supplier Master</p>
          <h3>{{ editingId == null ? 'Create Supplier' : 'Edit Supplier' }}</h3>
        </div>
        <button class="inline-btn" @click="closeForm">Close</button>
      </header>

      <div class="editor-grid wide">
        <label><span>Code</span><input v-model="form.code" /></label>
        <label><span>Name</span><input v-model="form.name" /></label>
        <label><span>Contact Person</span><input v-model="form.contactPerson" /></label>
        <label><span>Phone</span><input v-model="form.phone" /></label>
        <label><span>Email</span><input v-model="form.email" /></label>
        <label><span>Address</span><input v-model="form.address" /></label>
        <label class="full-width"><span>Description</span><input v-model="form.description" /></label>
      </div>

      <footer class="editor-actions">
        <button class="primary-btn" @click="save">{{ editingId == null ? 'Create' : 'Update' }}</button>
        <button class="secondary-btn" @click="closeForm">Cancel</button>
      </footer>
    </section>
  </div>
</template>
