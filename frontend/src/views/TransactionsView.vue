<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { apiFetch, type PageResponse } from '@/lib/api'
import { authState, hasAuthority } from '@/lib/auth'
import { notifyError } from '@/lib/notify'

type SupplierOption = {
  id: number
  code: string
  name: string
}

type StockMovement = {
  id: number
  inventoryItemId: number
  inventorySku: string
  inventoryName: string
  supplierId: number | null
  supplierCode: string | null
  supplierName: string | null
  type: string
  quantity: number
  quantityDelta: number
  unitPrice: number | null
  referenceNo: string | null
  partnerName: string | null
  remark: string | null
  occurredAt: string
}

const canRead = computed(() => hasAuthority('INVENTORY_MOVEMENT_READ') || hasAuthority('INVENTORY_READ'))
const movements = ref<StockMovement[]>([])
const suppliers = ref<SupplierOption[]>([])
const keyword = ref('')
const selectedType = ref('')
const selectedSupplierId = ref(0)
const loading = ref(false)
const page = reactive({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
const sortBy = ref('occurredAt')
const sortDir = ref<'asc' | 'desc'>('desc')

async function loadSuppliers() {
  if (!authState.profile || !hasAuthority('SUPPLIER_READ')) {
    suppliers.value = []
    return
  }

  try {
    suppliers.value = await apiFetch<SupplierOption[]>('/api/suppliers/options')
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load suppliers.')
  }
}

async function loadPage(targetPage = page.page) {
  if (!authState.profile || !canRead.value) {
    movements.value = []
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
    if (selectedType.value) {
      query.set('type', selectedType.value)
    }
    if (selectedSupplierId.value) {
      query.set('supplierId', String(selectedSupplierId.value))
    }

    const response = await apiFetch<PageResponse<StockMovement>>(`/api/inventory-items/movements?${query.toString()}`)
    movements.value = response.content
    page.page = response.page
    page.size = response.size
    page.totalElements = response.totalElements
    page.totalPages = response.totalPages
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load transaction details.')
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

function formatOccurredAt(value: string) {
  return new Date(value).toLocaleString()
}

function formatPrice(value: number | null) {
  return value == null ? '-' : value.toFixed(2)
}

function typeLabel(type: string) {
  if (type === 'PURCHASE') return 'Purchase'
  if (type === 'SALE') return 'Sale'
  if (type === 'ADJUSTMENT_IN') return 'Adjustment In'
  if (type === 'ADJUSTMENT_OUT') return 'Adjustment Out'
  return type
}

onMounted(() => {
  void Promise.all([loadSuppliers(), loadPage()])
})

watch(
  () => authState.version,
  () => {
    void Promise.all([loadSuppliers(), loadPage(0)])
  },
)
</script>

<template>
  <section class="crud-card">
    <header class="page-header">
      <div>
        <p class="section-label">Purchase And Sales</p>
        <h2>Transaction details</h2>
      </div>
    </header>

    <div class="toolbar transactions-toolbar">
      <input v-model="keyword" class="search-input" placeholder="Search by SKU, item, supplier, reference, remark" />
      <select v-model="selectedType" class="form-select">
        <option value="">All types</option>
        <option value="PURCHASE">Purchase</option>
        <option value="SALE">Sale</option>
      </select>
      <select v-model.number="selectedSupplierId" class="form-select">
        <option :value="0">All suppliers</option>
        <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
          {{ supplier.code }} · {{ supplier.name }}
        </option>
      </select>
      <button class="secondary-btn" @click="loadPage(0)">Search</button>
    </div>

    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'occurredAt' }" @click="changeSort('occurredAt', 'desc')">
                <span>Time</span>
                <span class="sort-indicator">{{ sortIndicator('occurredAt') }}</span>
              </button>
            </th>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'type' }" @click="changeSort('type', 'asc')">
                <span>Type</span>
                <span class="sort-indicator">{{ sortIndicator('type') }}</span>
              </button>
            </th>
            <th>Item</th>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'quantity' }" @click="changeSort('quantity', 'desc')">
                <span>Quantity</span>
                <span class="sort-indicator">{{ sortIndicator('quantity') }}</span>
              </button>
            </th>
            <th>Unit Price</th>
            <th>Supplier</th>
            <th>Partner</th>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'referenceNo' }" @click="changeSort('referenceNo', 'asc')">
                <span>Reference</span>
                <span class="sort-indicator">{{ sortIndicator('referenceNo') }}</span>
              </button>
            </th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="movement in movements" :key="movement.id">
            <td>{{ formatOccurredAt(movement.occurredAt) }}</td>
            <td>{{ typeLabel(movement.type) }}</td>
            <td>{{ movement.inventorySku }} · {{ movement.inventoryName }}</td>
            <td>{{ movement.quantity }}</td>
            <td>{{ formatPrice(movement.unitPrice) }}</td>
            <td>{{ movement.supplierName || '-' }}</td>
            <td>{{ movement.partnerName || '-' }}</td>
            <td>{{ movement.referenceNo || '-' }}</td>
            <td>{{ movement.remark || '-' }}</td>
          </tr>
          <tr v-if="!loading && movements.length === 0">
            <td colspan="9" class="empty-cell">No transaction detail records.</td>
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
</template>

<style scoped>
.transactions-toolbar {
  grid-template-columns: minmax(0, 2fr) minmax(160px, 1fr) minmax(220px, 1fr) auto;
  display: grid;
}

@media (max-width: 900px) {
  .transactions-toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
