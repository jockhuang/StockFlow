<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch, type PageResponse } from '@/lib/api'
import { authState, hasAuthority } from '@/lib/auth'
import { notifyError, notifySuccess } from '@/lib/notify'

type InventoryItem = {
  id: number
  sku: string
  name: string
  availableQuantity: number
}

type SalesOrder = {
  id: number
  inventoryItemId: number
  inventorySku: string
  inventoryName: string
  quantity: number
  unitPrice: number | null
  customerName: string | null
  referenceNo: string | null
  remark: string | null
  status: string
  createdAt: string
  shippedAt: string | null
}

const orders = ref<SalesOrder[]>([])
const items = ref<InventoryItem[]>([])
const route = useRoute()
const router = useRouter()
const keyword = ref('')
const loading = ref(false)
const page = reactive({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
const sortBy = ref('createdAt')
const sortDir = ref<'asc' | 'desc'>('desc')
const showForm = ref(false)

const form = reactive({
  inventoryItemId: 0,
  quantity: 1,
  unitPrice: '',
  customerName: '',
  referenceNo: '',
  remark: '',
})

const canWrite = computed(() => hasAuthority('SALES_ORDER_WRITE'))

async function loadItems() {
  if (!authState.profile || !hasAuthority('INVENTORY_READ')) {
    items.value = []
    return
  }

  try {
    const response = await apiFetch<PageResponse<InventoryItem>>('/api/inventory-items?page=0&size=200')
    items.value = response.content
    if (!form.inventoryItemId && items.value[0]) {
      form.inventoryItemId = items.value[0].id
    }
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load inventory items.')
  }
}

async function loadPage(targetPage = page.page) {
  if (!authState.profile || !hasAuthority('SALES_ORDER_READ')) {
    orders.value = []
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
    const response = await apiFetch<PageResponse<SalesOrder>>(`/api/sales-orders?${query.toString()}`)
    orders.value = response.content
    page.page = response.page
    page.size = response.size
    page.totalElements = response.totalElements
    page.totalPages = response.totalPages
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load sales orders.')
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
  form.inventoryItemId = items.value[0]?.id ?? 0
  form.quantity = 1
  form.unitPrice = ''
  form.customerName = ''
  form.referenceNo = ''
  form.remark = ''
}

function openForm() {
  resetForm()
  showForm.value = true
}

function openPrefilledForm(itemId?: number) {
  resetForm()

  if (itemId != null && items.value.some((item) => item.id === itemId)) {
    form.inventoryItemId = itemId
  }

  showForm.value = true
}

function closeForm() {
  showForm.value = false
  resetForm()
}

async function save() {
  try {
    await apiFetch('/api/sales-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inventoryItemId: form.inventoryItemId,
        quantity: form.quantity,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : null,
        customerName: form.customerName || null,
        referenceNo: form.referenceNo || null,
        remark: form.remark || null,
      }),
    })
    closeForm()
    notifySuccess('create sales order success')
    await Promise.all([loadItems(), loadPage(0)])
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to create sales order.')
  }
}

async function ship(id: number) {
  try {
    await apiFetch(`/api/sales-orders/${id}/ship`, { method: 'POST' })
    notifySuccess('sales order shipped success')
    await Promise.all([loadItems(), loadPage(page.page)])
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to ship sales order.')
  }
}

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : '-'
}

function tryOpenFromRoute() {
  if (!canWrite.value || !items.value.length) {
    return
  }

  if (route.query.create !== '1') {
    return
  }

  const itemId = Number(route.query.itemId)
  openPrefilledForm(Number.isFinite(itemId) ? itemId : undefined)
  void router.replace({ query: {} })
}

onMounted(() => {
  void Promise.all([loadItems(), loadPage()]).then(() => {
    tryOpenFromRoute()
  })
})

watch(
  () => authState.version,
  () => {
    void Promise.all([loadItems(), loadPage(0)]).then(() => {
      tryOpenFromRoute()
    })
  },
)

watch(
  () => [route.query.create, route.query.itemId, items.value.length, canWrite.value] as const,
  () => {
    tryOpenFromRoute()
  },
)
</script>

<template>
  <section class="crud-card">
    <header class="page-header">
      <div>
        <p class="section-label">Sales</p>
        <h2>Sales Orders</h2>
      </div>
      <button v-if="canWrite" class="primary-btn" @click="openForm">New Sales Order</button>
    </header>

    <div class="toolbar">
      <input v-model="keyword" class="search-input" placeholder="Search by item, customer, or reference" />
      <button class="secondary-btn" @click="loadPage(0)">Search</button>
    </div>

    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'quantity' }" @click="changeSort('quantity', 'desc')">
                <span>Quantity</span>
                <span class="sort-indicator">{{ sortIndicator('quantity') }}</span>
              </button>
            </th>
            <th>Customer</th>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'status' }" @click="changeSort('status', 'asc')">
                <span>Status</span>
                <span class="sort-indicator">{{ sortIndicator('status') }}</span>
              </button>
            </th>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'createdAt' }" @click="changeSort('createdAt', 'desc')">
                <span>Created</span>
                <span class="sort-indicator">{{ sortIndicator('createdAt') }}</span>
              </button>
            </th>
            <th>Shipped</th>
            <th v-if="canWrite">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>{{ order.inventorySku }} · {{ order.inventoryName }}</td>
            <td>{{ order.quantity }}</td>
            <td>{{ order.customerName || '-' }}</td>
            <td>{{ order.status }}</td>
            <td>{{ formatTime(order.createdAt) }}</td>
            <td>{{ formatTime(order.shippedAt) }}</td>
            <td v-if="canWrite">
              <div v-if="order.status === 'CREATED'" class="row-actions">
                <button class="inline-btn" @click="ship(order.id)">Ship</button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && orders.length === 0">
            <td :colspan="canWrite ? 7 : 6" class="empty-cell">No sales orders found.</td>
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
          <p class="section-label">Sales</p>
          <h3>Create Sales Order</h3>
        </div>
        <button class="inline-btn" @click="closeForm">Close</button>
      </header>
      <div class="editor-grid">
        <label>
          <span>Item</span>
          <select v-model.number="form.inventoryItemId" class="form-select">
            <option v-for="item in items" :key="item.id" :value="item.id">
              {{ item.sku }} · {{ item.name }} · Available {{ item.availableQuantity }}
            </option>
          </select>
        </label>
        <label><span>Quantity</span><input v-model.number="form.quantity" type="number" min="1" /></label>
        <label><span>Unit Price</span><input v-model="form.unitPrice" type="number" min="0" step="0.01" /></label>
        <label><span>Customer</span><input v-model="form.customerName" /></label>
        <label><span>Reference No.</span><input v-model="form.referenceNo" /></label>
        <label><span>Remark</span><input v-model="form.remark" /></label>
      </div>
      <footer class="editor-actions">
        <button class="primary-btn" @click="save">Create</button>
        <button class="secondary-btn" @click="closeForm">Cancel</button>
      </footer>
    </section>
  </div>
</template>
