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
  supplierIds: number[]
  supplierNames: string[]
}

type Supplier = {
  id: number
  code: string
  name: string
}

type PurchaseOrder = {
  id: number
  inventoryItemId: number
  inventorySku: string
  inventoryName: string
  supplierId: number
  supplierCode: string
  supplierName: string
  quantity: number
  unitPrice: number | null
  referenceNo: string | null
  remark: string | null
  status: string
  createdAt: string
  receivedAt: string | null
}

const orders = ref<PurchaseOrder[]>([])
const items = ref<InventoryItem[]>([])
const suppliers = ref<Supplier[]>([])
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
  supplierId: 0,
  quantity: 1,
  unitPrice: '',
  referenceNo: '',
  remark: '',
})

const canWrite = computed(() => hasAuthority('PURCHASE_ORDER_WRITE'))
const selectedItem = computed(() => items.value.find((item) => item.id === form.inventoryItemId) ?? null)
const availableSuppliers = computed(() =>
  suppliers.value.filter((supplier) => selectedItem.value?.supplierIds.includes(supplier.id) ?? false),
)

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

async function loadSuppliers() {
  if (!authState.profile || !hasAuthority('SUPPLIER_READ')) {
    suppliers.value = []
    return
  }

  try {
    suppliers.value = await apiFetch<Supplier[]>('/api/suppliers/options')
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load suppliers.')
  }
}

async function loadPage(targetPage = page.page) {
  if (!authState.profile || !hasAuthority('PURCHASE_ORDER_READ')) {
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
    const response = await apiFetch<PageResponse<PurchaseOrder>>(`/api/purchase-orders?${query.toString()}`)
    orders.value = response.content
    page.page = response.page
    page.size = response.size
    page.totalElements = response.totalElements
    page.totalPages = response.totalPages
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load purchase orders.')
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
  form.supplierId = 0
  form.quantity = 1
  form.unitPrice = ''
  form.referenceNo = ''
  form.remark = ''
}

function openForm() {
  resetForm()
  form.supplierId = availableSuppliers.value[0]?.id ?? 0
  showForm.value = true
}

function openPrefilledForm(itemId?: number) {
  resetForm()

  if (itemId != null && items.value.some((item) => item.id === itemId)) {
    form.inventoryItemId = itemId
  }

  form.supplierId = availableSuppliers.value[0]?.id ?? 0
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  resetForm()
}

async function save() {
  try {
    await apiFetch('/api/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inventoryItemId: form.inventoryItemId,
        supplierId: form.supplierId,
        quantity: form.quantity,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : null,
        referenceNo: form.referenceNo || null,
        remark: form.remark || null,
      }),
    })
    closeForm()
    notifySuccess('create purchase order success')
    await loadPage(0)
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to create purchase order.')
  }
}

async function receive(id: number) {
  try {
    await apiFetch(`/api/purchase-orders/${id}/receive`, { method: 'POST' })
    notifySuccess('purchase order received success')
    await loadPage(page.page)
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to receive purchase order.')
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

watch(selectedItem, () => {
  form.supplierId = availableSuppliers.value[0]?.id ?? 0
})

onMounted(() => {
  void Promise.all([loadItems(), loadSuppliers(), loadPage()]).then(() => {
    tryOpenFromRoute()
  })
})

watch(
  () => authState.version,
  () => {
    void Promise.all([loadItems(), loadSuppliers(), loadPage(0)]).then(() => {
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
        <p class="section-label">Procurement</p>
        <h2>Purchase Orders</h2>
      </div>
      <button v-if="canWrite" class="primary-btn" @click="openForm">New Purchase Order</button>
    </header>

    <div class="toolbar">
      <input v-model="keyword" class="search-input" placeholder="Search by item, supplier, or reference" />
      <button class="secondary-btn" @click="loadPage(0)">Search</button>
    </div>

    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Supplier</th>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'quantity' }" @click="changeSort('quantity', 'desc')">
                <span>Quantity</span>
                <span class="sort-indicator">{{ sortIndicator('quantity') }}</span>
              </button>
            </th>
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
            <th>Received</th>
            <th v-if="canWrite">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>{{ order.inventorySku }} · {{ order.inventoryName }}</td>
            <td>{{ order.supplierCode }} · {{ order.supplierName }}</td>
            <td>{{ order.quantity }}</td>
            <td>{{ order.status }}</td>
            <td>{{ formatTime(order.createdAt) }}</td>
            <td>{{ formatTime(order.receivedAt) }}</td>
            <td v-if="canWrite">
              <div v-if="order.status === 'CREATED'" class="row-actions">
                <button class="inline-btn" @click="receive(order.id)">Confirm Receipt</button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && orders.length === 0">
            <td :colspan="canWrite ? 7 : 6" class="empty-cell">No purchase orders found.</td>
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
          <p class="section-label">Procurement</p>
          <h3>Create Purchase Order</h3>
        </div>
        <button class="inline-btn" @click="closeForm">Close</button>
      </header>
      <div class="editor-grid">
        <label>
          <span>Item</span>
          <select v-model.number="form.inventoryItemId" class="form-select">
            <option v-for="item in items" :key="item.id" :value="item.id">{{ item.sku }} · {{ item.name }}</option>
          </select>
        </label>
        <label>
          <span>Supplier</span>
          <select v-model.number="form.supplierId" class="form-select">
            <option :value="0">Select supplier</option>
            <option v-for="supplier in availableSuppliers" :key="supplier.id" :value="supplier.id">
              {{ supplier.code }} · {{ supplier.name }}
            </option>
          </select>
        </label>
        <label><span>Quantity</span><input v-model.number="form.quantity" type="number" min="1" /></label>
        <label><span>Unit Price</span><input v-model="form.unitPrice" type="number" min="0" step="0.01" /></label>
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
