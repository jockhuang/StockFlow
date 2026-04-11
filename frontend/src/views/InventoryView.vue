<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { apiFetch, type PageResponse } from '@/lib/api'
import { authState, hasAuthority } from '@/lib/auth'
import { notifyError, notifyInfo, notifySuccess } from '@/lib/notify'

type InventoryItem = {
  id: number
  sku: string
  name: string
  quantity: number
  onHandQuantity: number
  inTransitQuantity: number
  committedQuantity: number
  availableQuantity: number
  averageUnitCost: number | null
  inventoryCost: number | null
  totalSalesRevenue: number | null
  totalSalesCost: number | null
  totalSalesProfit: number | null
  location: string
  categoryId: number
  categoryCode: string
  categoryName: string
  supplierIds: number[]
  supplierNames: string[]
}

type CategoryOption = {
  id: number
  code: string
  name: string
}

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

type InventorySummary = {
  totalItems: number
  totalStockQuantity: number
  totalOnHandQuantity: number
  totalInTransitQuantity: number
  totalCommittedQuantity: number
  totalAvailableQuantity: number
  lowStockItems: number
  totalPurchaseQuantity: number
  totalSaleQuantity: number
  totalInventoryCost: number | null
  totalSalesRevenue: number | null
  totalSalesCost: number | null
  totalSalesProfit: number | null
  recentMovements: StockMovement[]
}

const movementTypeOptions = [
  { value: 'ADJUSTMENT_IN', label: 'Adjustment In' },
  { value: 'ADJUSTMENT_OUT', label: 'Adjustment Out' },
]

const movementTypeLabels: Record<string, string> = {
  OPENING: 'Opening Stock',
  PURCHASE: 'Purchase Inbound',
  SALE: 'Sales Outbound',
  ADJUSTMENT_IN: 'Adjustment In',
  ADJUSTMENT_OUT: 'Adjustment Out',
}

const items = ref<InventoryItem[]>([])
const categories = ref<CategoryOption[]>([])
const suppliers = ref<SupplierOption[]>([])
const summary = ref<InventorySummary | null>(null)
const movements = ref<StockMovement[]>([])

const itemKeyword = ref('')
const movementKeyword = ref('')
const loadingItems = ref(false)
const loadingMovements = ref(false)
const itemSortBy = ref('sku')
const itemSortDir = ref<'asc' | 'desc'>('asc')
const movementSortBy = ref('occurredAt')
const movementSortDir = ref<'asc' | 'desc'>('desc')

const itemPage = reactive({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
const movementPage = reactive({ page: 0, size: 10, totalElements: 0, totalPages: 0 })

const editingId = ref<number | null>(null)
const showItemForm = ref(false)
const showMovementForm = ref(false)

const itemForm = reactive({
  sku: '',
  name: '',
  quantity: 0,
  location: '',
  categoryId: 0,
  supplierIds: [] as number[],
})

const movementForm = reactive({
  inventoryItemId: 0,
  supplierId: 0,
  type: 'PURCHASE',
  quantity: 1,
  unitPrice: '',
  referenceNo: '',
  partnerName: '',
  remark: '',
})

const canManageItems = computed(() => hasAuthority('INVENTORY_WRITE'))
const canReadMovements = computed(() => hasAuthority('INVENTORY_READ') || hasAuthority('INVENTORY_MOVEMENT_READ'))
const canRecordMovement = computed(() => hasAuthority('INVENTORY_WRITE') || hasAuthority('INVENTORY_MOVEMENT_WRITE'))
const canViewFinancials = computed(() => hasAuthority('INVENTORY_FINANCIAL_READ'))
const canCreatePurchaseOrder = computed(() => hasAuthority('PURCHASE_ORDER_WRITE'))
const canCreateSalesOrder = computed(() => hasAuthority('SALES_ORDER_WRITE'))
const canOperateItemRow = computed(() => canManageItems.value || canRecordMovement.value || canCreatePurchaseOrder.value || canCreateSalesOrder.value)
const inventoryColspan = computed(() => {
  let columns = 10
  if (canViewFinancials.value) {
    columns += 4
  }
  if (canOperateItemRow.value) {
    columns += 1
  }
  return columns
})
const itemQuantityLabel = computed(() => (editingId.value == null ? 'Opening Stock' : 'Current Stock'))
const selectedMovementItem = computed(() => items.value.find((item) => item.id === movementForm.inventoryItemId) ?? null)
const purchaseSuppliers = computed(() =>
  suppliers.value.filter((supplier) => selectedMovementItem.value?.supplierIds.includes(supplier.id) ?? false),
)

async function loadInventoryPage(targetPage = itemPage.page) {
  if (!authState.profile || !hasAuthority('INVENTORY_READ')) {
    items.value = []
    return
  }

  loadingItems.value = true
  try {
    const query = new URLSearchParams({
      keyword: itemKeyword.value,
      page: String(targetPage),
      size: String(itemPage.size),
      sortBy: itemSortBy.value,
      sortDir: itemSortDir.value,
    })
    const response = await apiFetch<PageResponse<InventoryItem>>(`/api/inventory-items?${query.toString()}`)
    items.value = response.content
    itemPage.page = response.page
    itemPage.size = response.size
    itemPage.totalElements = response.totalElements
    itemPage.totalPages = response.totalPages
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load inventory items.')
  } finally {
    loadingItems.value = false
  }
}

async function loadMovements(targetPage = movementPage.page) {
  if (!authState.profile || !canReadMovements.value) {
    movements.value = []
    return
  }

  loadingMovements.value = true
  try {
    const query = new URLSearchParams({
      keyword: movementKeyword.value,
      page: String(targetPage),
      size: String(movementPage.size),
      sortBy: movementSortBy.value,
      sortDir: movementSortDir.value,
    })
    const response = await apiFetch<PageResponse<StockMovement>>(`/api/inventory-items/movements?${query.toString()}`)
    movements.value = response.content
    movementPage.page = response.page
    movementPage.size = response.size
    movementPage.totalElements = response.totalElements
    movementPage.totalPages = response.totalPages
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load stock movements.')
  } finally {
    loadingMovements.value = false
  }
}

async function loadSummary() {
  if (!authState.profile || !hasAuthority('INVENTORY_READ')) {
    summary.value = null
    return
  }

  try {
    summary.value = await apiFetch<InventorySummary>('/api/inventory-items/summary')
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load inventory summary.')
  }
}

async function loadCategories() {
  if (!authState.profile || !hasAuthority('CATEGORY_READ')) {
    categories.value = []
    return
  }

  try {
    categories.value = await apiFetch<CategoryOption[]>('/api/categories/options')
    if (itemForm.categoryId === 0 && categories.value[0]?.id) {
      itemForm.categoryId = categories.value[0].id
    }
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load categories.')
  }
}

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

function resetItemForm() {
  editingId.value = null
  itemForm.sku = ''
  itemForm.name = ''
  itemForm.quantity = 0
  itemForm.location = ''
  itemForm.categoryId = categories.value[0]?.id ?? 0
}

function startCreateItem() {
  resetItemForm()
  showItemForm.value = true
}

function startEditItem(item: InventoryItem) {
  editingId.value = item.id
  itemForm.sku = item.sku
  itemForm.name = item.name
  itemForm.quantity = item.quantity
  itemForm.location = item.location
  itemForm.categoryId = item.categoryId
  showItemForm.value = true
}

function closeItemForm() {
  showItemForm.value = false
  resetItemForm()
}

function resetMovementForm(itemId = items.value[0]?.id ?? 0, type = 'PURCHASE') {
  movementForm.inventoryItemId = itemId
  movementForm.supplierId = 0
  movementForm.type = type
  movementForm.quantity = 1
  movementForm.unitPrice = ''
  movementForm.referenceNo = ''
  movementForm.partnerName = ''
  movementForm.remark = ''
}

function openMovementForm(item?: InventoryItem, type = 'PURCHASE') {
  const firstItem = items.value[0]
  if (!firstItem) {
    notifyInfo('Create an inventory item before recording stock movements.')
    return
  }

  resetMovementForm(item?.id ?? firstItem.id, type)
  const currentItem = items.value.find((entry) => entry.id === (item?.id ?? firstItem.id))
  if (type === 'PURCHASE') {
    movementForm.supplierId = currentItem?.supplierIds[0] ?? 0
  }
  showMovementForm.value = true
}

function closeMovementForm() {
  showMovementForm.value = false
  resetMovementForm()
}

async function saveItem() {
  const isCreate = editingId.value == null
  const payload = {
    sku: itemForm.sku,
    name: itemForm.name,
    quantity: itemForm.quantity,
    location: itemForm.location,
    categoryId: itemForm.categoryId,
    supplierIds: selectedItemSuppliersForSave(),
  }

  try {
    if (isCreate) {
      await apiFetch('/api/inventory-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch(`/api/inventory-items/${editingId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    closeItemForm()
    notifySuccess(isCreate ? 'create inventory item success' : 'update inventory item success')
    await Promise.all([loadSummary(), loadInventoryPage(), loadMovements(0)])
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to save inventory item.')
  }
}

async function recordMovement() {
  const payload = {
    inventoryItemId: movementForm.inventoryItemId,
    supplierId: movementForm.supplierId || null,
    type: movementForm.type,
    quantity: movementForm.quantity,
    unitPrice: movementForm.unitPrice ? Number(movementForm.unitPrice) : null,
    referenceNo: movementForm.referenceNo || null,
    partnerName: movementForm.partnerName || null,
    remark: movementForm.remark || null,
  }

  try {
    await apiFetch('/api/inventory-items/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    closeMovementForm()
    notifySuccess('record stock movement success')
    await Promise.all([loadSummary(), loadInventoryPage(), loadMovements(0)])
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to record stock movement.')
  }
}

async function remove(id: number) {
  try {
    await apiFetch(`/api/inventory-items/${id}`, { method: 'DELETE' })
    notifySuccess('delete inventory item success')
    await Promise.all([loadSummary(), loadInventoryPage(Math.max(0, itemPage.page)), loadMovements(0)])
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to delete inventory item.')
  }
}

function movementTypeLabel(type: string) {
  return movementTypeLabels[type] ?? type
}

function formatOccurredAt(value: string) {
  return new Date(value).toLocaleString()
}

function formatPrice(value: number | null) {
  return value == null ? '-' : value.toFixed(2)
}

function applyItemPageSize() {
  void loadInventoryPage(0)
}

function applyMovementPageSize() {
  void loadMovements(0)
}

function changeItemSort(field: string, initialDir: 'asc' | 'desc' = 'asc') {
  if (itemSortBy.value === field) {
    itemSortDir.value = itemSortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    itemSortBy.value = field
    itemSortDir.value = initialDir
  }

  void loadInventoryPage(0)
}

function changeMovementSort(field: string, initialDir: 'asc' | 'desc' = 'asc') {
  if (movementSortBy.value === field) {
    movementSortDir.value = movementSortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    movementSortBy.value = field
    movementSortDir.value = initialDir
  }

  void loadMovements(0)
}

function itemSortIndicator(field: string) {
  if (itemSortBy.value !== field) {
    return ''
  }

  return itemSortDir.value === 'asc' ? '↑' : '↓'
}

function movementSortIndicator(field: string) {
  if (movementSortBy.value !== field) {
    return ''
  }

  return movementSortDir.value === 'asc' ? '↑' : '↓'
}

function selectedItemSuppliersForSave() {
  const existingItem = items.value.find((item) => item.id === editingId.value)
  return existingItem?.supplierIds ?? []
}

watch(
  () => movementForm.inventoryItemId,
  () => {
    if (movementForm.type === 'PURCHASE') {
      movementForm.supplierId = purchaseSuppliers.value[0]?.id ?? 0
      return
    }

    movementForm.supplierId = 0
  },
)

watch(
  () => movementForm.type,
  (type) => {
    if (type === 'PURCHASE') {
      movementForm.supplierId = purchaseSuppliers.value[0]?.id ?? 0
      return
    }

    movementForm.supplierId = 0
  },
)

onMounted(() => {
  void Promise.all([loadCategories(), loadSuppliers(), loadSummary(), loadInventoryPage(), loadMovements()])
})

watch(
  () => authState.version,
  () => {
    void Promise.all([loadCategories(), loadSuppliers(), loadSummary(), loadInventoryPage(0), loadMovements(0)])
  },
)
</script>

<template>
  <section class="inventory-workbench">
    <header class="page-header">
      <div>
        <p class="section-label">Purchase / Sales / Inventory</p>
        <h2>Inventory workbench</h2>
      </div>
      <div class="header-actions">
        <RouterLink v-if="hasAuthority('PURCHASE_ORDER_READ')" to="/inventory/purchases" class="secondary-btn header-link">
          Purchases
        </RouterLink>
        <RouterLink v-if="hasAuthority('SALES_ORDER_READ')" to="/inventory/sales" class="secondary-btn header-link">
          Sales
        </RouterLink>
        <RouterLink v-if="canReadMovements" to="/inventory/transactions" class="secondary-btn header-link">
          View Transactions
        </RouterLink>
        <button v-if="canRecordMovement" class="secondary-btn" @click="openMovementForm(undefined, 'ADJUSTMENT_IN')">
          Stock Adjustment
        </button>
        <button v-if="canManageItems" class="primary-btn" @click="startCreateItem">New Item</button>
      </div>
    </header>

    <section class="summary-grid">
      <article class="summary-card">
        <span>SKU count</span>
        <strong>{{ summary?.totalItems ?? 0 }}</strong>
      </article>
      <article class="summary-card">
        <span>On-hand stock</span>
        <strong>{{ summary?.totalOnHandQuantity ?? 0 }}</strong>
      </article>
      <article class="summary-card">
        <span>In-transit stock</span>
        <strong>{{ summary?.totalInTransitQuantity ?? 0 }}</strong>
      </article>
      <article class="summary-card">
        <span>Sold not shipped</span>
        <strong>{{ summary?.totalCommittedQuantity ?? 0 }}</strong>
      </article>
      <article class="summary-card">
        <span>Available stock</span>
        <strong>{{ summary?.totalAvailableQuantity ?? 0 }}</strong>
      </article>
      <article v-if="canViewFinancials" class="summary-card">
        <span>Inventory cost</span>
        <strong>{{ formatPrice(summary?.totalInventoryCost ?? null) }}</strong>
      </article>
      <article v-if="canViewFinancials" class="summary-card profit">
        <span>Realized profit</span>
        <strong>{{ formatPrice(summary?.totalSalesProfit ?? null) }}</strong>
      </article>
      <article class="summary-card danger">
        <span>Low stock SKUs</span>
        <strong>{{ summary?.lowStockItems ?? 0 }}</strong>
      </article>
    </section>

    <section class="crud-card">
      <header class="section-head">
        <div>
          <p class="section-label">Inventory Ledger</p>
          <h3>Item master</h3>
        </div>
      </header>

      <div class="toolbar">
        <input v-model="itemKeyword" class="search-input" placeholder="Search by SKU, name, location, category" />
        <button class="secondary-btn" @click="loadInventoryPage(0)">Search</button>
      </div>

      <div class="table-shell">
        <table>
          <thead>
            <tr>
              <th>
                <button class="sort-button" :class="{ active: itemSortBy === 'sku' }" @click="changeItemSort('sku', 'asc')">
                  <span>SKU</span>
                  <span class="sort-indicator">{{ itemSortIndicator('sku') }}</span>
                </button>
              </th>
              <th>
                <button class="sort-button" :class="{ active: itemSortBy === 'name' }" @click="changeItemSort('name', 'asc')">
                  <span>Name</span>
                  <span class="sort-indicator">{{ itemSortIndicator('name') }}</span>
                </button>
              </th>
              <th>
                <button class="sort-button" :class="{ active: itemSortBy === 'onHandQuantity' }" @click="changeItemSort('onHandQuantity', 'desc')">
                  <span>On Hand</span>
                  <span class="sort-indicator">{{ itemSortIndicator('onHandQuantity') }}</span>
                </button>
              </th>
              <th>In Transit</th>
              <th>Sold Pending Ship</th>
              <th>Available</th>
              <th v-if="canViewFinancials">Avg Cost</th>
              <th v-if="canViewFinancials">Stock Cost</th>
              <th v-if="canViewFinancials">Sales Revenue</th>
              <th v-if="canViewFinancials">Profit</th>
              <th>
                <button class="sort-button" :class="{ active: itemSortBy === 'location' }" @click="changeItemSort('location', 'asc')">
                  <span>Location</span>
                  <span class="sort-indicator">{{ itemSortIndicator('location') }}</span>
                </button>
              </th>
              <th>Category</th>
              <th>Suppliers</th>
              <th v-if="canOperateItemRow">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.sku }}</td>
              <td>{{ item.name }}</td>
              <td><span class="stock-badge" :class="{ low: item.onHandQuantity <= 10 }">{{ item.onHandQuantity }}</span></td>
              <td>{{ item.inTransitQuantity }}</td>
              <td>{{ item.committedQuantity }}</td>
              <td>{{ item.availableQuantity }}</td>
              <td v-if="canViewFinancials">{{ formatPrice(item.averageUnitCost) }}</td>
              <td v-if="canViewFinancials">{{ formatPrice(item.inventoryCost) }}</td>
              <td v-if="canViewFinancials">{{ formatPrice(item.totalSalesRevenue) }}</td>
              <td v-if="canViewFinancials">{{ formatPrice(item.totalSalesProfit) }}</td>
              <td>
                {{ item.location }}
              </td>
              <td>{{ item.categoryName }}</td>
              <td>{{ item.supplierNames.join(', ') || '-' }}</td>
              <td v-if="canOperateItemRow">
                <div class="row-actions">
                  <RouterLink
                    v-if="canCreatePurchaseOrder"
                    class="inline-btn"
                    :to="{ path: '/inventory/purchases', query: { create: '1', itemId: String(item.id) } }"
                  >
                    Purchase
                  </RouterLink>
                  <RouterLink
                    v-if="canCreateSalesOrder"
                    class="inline-btn"
                    :to="{ path: '/inventory/sales', query: { create: '1', itemId: String(item.id) } }"
                  >
                    Sale
                  </RouterLink>
                  <button v-if="canManageItems" class="inline-btn" @click="startEditItem(item)">Edit</button>
                  <button v-if="canRecordMovement" class="inline-btn" @click="openMovementForm(item, 'ADJUSTMENT_IN')">Adjust</button>
                  <button v-if="canManageItems" class="inline-btn danger" @click="remove(item.id)">Delete</button>
                </div>
              </td>
            </tr>
            <tr v-if="!loadingItems && items.length === 0">
              <td :colspan="inventoryColspan" class="empty-cell">No inventory items found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <PaginationControls
        v-model:page="itemPage.page"
        v-model:size="itemPage.size"
        :total-elements="itemPage.totalElements"
        :total-pages="itemPage.totalPages"
        :disabled="loadingItems"
        @go="loadInventoryPage"
        @size-change="applyItemPageSize"
      />
    </section>

    <section class="movement-layout">
      <article class="crud-card">
        <header class="section-head">
          <div>
            <p class="section-label">Operations</p>
            <h3>Stock movements</h3>
          </div>
        </header>

        <div class="toolbar movement-toolbar">
          <input
            v-model="movementKeyword"
            class="search-input movement-search-input"
            placeholder="Search by SKU, item, partner, reference, remark"
          />
          <button class="secondary-btn movement-search-btn" @click="loadMovements(0)">Search</button>
        </div>

        <div class="table-shell">
          <table>
            <thead>
              <tr>
                <th>
                  <button class="sort-button" :class="{ active: movementSortBy === 'occurredAt' }" @click="changeMovementSort('occurredAt', 'desc')">
                    <span>Time</span>
                    <span class="sort-indicator">{{ movementSortIndicator('occurredAt') }}</span>
                  </button>
                </th>
                <th>
                  <button class="sort-button" :class="{ active: movementSortBy === 'type' }" @click="changeMovementSort('type', 'asc')">
                    <span>Type</span>
                    <span class="sort-indicator">{{ movementSortIndicator('type') }}</span>
                  </button>
                </th>
                <th>Item</th>
                <th>
                  <button class="sort-button" :class="{ active: movementSortBy === 'quantity' }" @click="changeMovementSort('quantity', 'desc')">
                    <span>Qty</span>
                    <span class="sort-indicator">{{ movementSortIndicator('quantity') }}</span>
                  </button>
                </th>
                <th>Delta</th>
                <th>Unit Price</th>
                <th>Supplier</th>
                <th>Partner</th>
                <th>
                  <button class="sort-button" :class="{ active: movementSortBy === 'referenceNo' }" @click="changeMovementSort('referenceNo', 'asc')">
                    <span>Reference</span>
                    <span class="sort-indicator">{{ movementSortIndicator('referenceNo') }}</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="movement in movements" :key="movement.id">
                <td>{{ formatOccurredAt(movement.occurredAt) }}</td>
                <td>{{ movementTypeLabel(movement.type) }}</td>
                <td>{{ movement.inventorySku }} · {{ movement.inventoryName }}</td>
                <td>{{ movement.quantity }}</td>
                <td :class="movement.quantityDelta > 0 ? 'delta-in' : 'delta-out'">
                  {{ movement.quantityDelta > 0 ? `+${movement.quantityDelta}` : movement.quantityDelta }}
                </td>
                <td>{{ formatPrice(movement.unitPrice) }}</td>
                <td>{{ movement.supplierName || '-' }}</td>
                <td>{{ movement.partnerName || '-' }}</td>
                <td>{{ movement.referenceNo || '-' }}</td>
              </tr>
              <tr v-if="!loadingMovements && movements.length === 0">
                <td colspan="9" class="empty-cell">No stock movement records.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <PaginationControls
          v-model:page="movementPage.page"
          v-model:size="movementPage.size"
          :total-elements="movementPage.totalElements"
          :total-pages="movementPage.totalPages"
          :disabled="loadingMovements"
          @go="loadMovements"
          @size-change="applyMovementPageSize"
        />
      </article>

      <aside class="recent-card">
        <header class="section-head">
          <div>
            <p class="section-label">Realtime</p>
            <h3>Recent activity</h3>
          </div>
        </header>

        <div v-if="summary?.recentMovements?.length" class="recent-list">
          <article v-for="movement in summary.recentMovements" :key="movement.id" class="recent-item">
            <strong>{{ movementTypeLabel(movement.type) }}</strong>
            <p>{{ movement.inventorySku }} · {{ movement.inventoryName }}</p>
            <span>{{ movement.quantityDelta > 0 ? `+${movement.quantityDelta}` : movement.quantityDelta }}</span>
            <small>{{ formatOccurredAt(movement.occurredAt) }}</small>
          </article>
        </div>
        <p v-else class="empty-text">No recent activity.</p>
      </aside>
    </section>
  </section>

  <div v-if="showItemForm" class="modal-backdrop" @click.self="closeItemForm">
    <section class="modal-card">
      <header class="modal-header">
        <div>
          <p class="section-label">Item Master</p>
          <h3>{{ editingId == null ? 'Create Inventory Item' : 'Edit Inventory Item' }}</h3>
        </div>
        <button class="inline-btn" @click="closeItemForm">Close</button>
      </header>

      <div class="editor-grid">
        <label><span>SKU</span><input v-model="itemForm.sku" /></label>
        <label><span>Name</span><input v-model="itemForm.name" /></label>
        <label><span>{{ itemQuantityLabel }}</span><input v-model.number="itemForm.quantity" type="number" min="0" /></label>
        <label><span>Location</span><input v-model="itemForm.location" /></label>
        <label class="full-width">
          <span>Category</span>
          <select v-model.number="itemForm.categoryId" class="form-select">
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.code }} · {{ category.name }}
            </option>
          </select>
        </label>
      </div>

      <footer class="editor-actions">
        <button class="primary-btn" @click="saveItem">{{ editingId == null ? 'Create' : 'Update' }}</button>
        <button class="secondary-btn" @click="closeItemForm">Cancel</button>
      </footer>
    </section>
  </div>

  <div v-if="showMovementForm" class="modal-backdrop" @click.self="closeMovementForm">
    <section class="modal-card modal-card-wide">
      <header class="modal-header">
        <div>
          <p class="section-label">Stock Operation</p>
          <h3>Stock adjustment</h3>
        </div>
        <button class="inline-btn" @click="closeMovementForm">Close</button>
      </header>

      <div class="editor-grid wide">
        <label>
          <span>Item</span>
          <select v-model.number="movementForm.inventoryItemId" class="form-select">
            <option v-for="item in items" :key="item.id" :value="item.id">{{ item.sku }} · {{ item.name }}</option>
          </select>
        </label>
        <label>
          <span>Type</span>
          <select v-model="movementForm.type" class="form-select">
            <option v-for="option in movementTypeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label><span>Quantity</span><input v-model.number="movementForm.quantity" type="number" min="1" /></label>
        <label><span>Unit Price</span><input v-model="movementForm.unitPrice" type="number" min="0" step="0.01" /></label>
        <label v-if="movementForm.type === 'PURCHASE'">
          <span>Supplier</span>
          <select v-model.number="movementForm.supplierId" class="form-select">
            <option :value="0">No supplier</option>
            <option v-for="supplier in purchaseSuppliers" :key="supplier.id" :value="supplier.id">
              {{ supplier.code }} · {{ supplier.name }}
            </option>
          </select>
        </label>
        <label><span>Reference No.</span><input v-model="movementForm.referenceNo" /></label>
        <label><span>Partner</span><input v-model="movementForm.partnerName" /></label>
        <label class="full-width"><span>Remark</span><input v-model="movementForm.remark" /></label>
      </div>

      <footer class="editor-actions">
        <button class="primary-btn" @click="recordMovement">Submit</button>
        <button class="secondary-btn" @click="closeMovementForm">Cancel</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.inventory-workbench {
  display: grid;
  gap: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.summary-card,
.recent-card {
  padding: 20px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(240, 253, 250, 0.96));
  border: 1px solid var(--line);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.06);
}

.summary-card span,
.recent-item small {
  color: var(--muted);
}

.summary-card strong {
  display: block;
  margin-top: 10px;
  font-size: 2rem;
  color: var(--text);
}

.summary-card.danger strong {
  color: #b91c1c;
}

.summary-card.profit strong {
  color: #166534;
}

.section-head h3 {
  margin: 8px 0 0;
}

.stock-badge {
  display: inline-flex;
  min-width: 56px;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.stock-badge.low {
  background: rgba(185, 28, 28, 0.12);
  color: #b91c1c;
}

.movement-layout {
  display: grid;
  grid-template-columns: minmax(0, 2.3fr) minmax(280px, 1fr);
  gap: 20px;
  align-items: start;
}

.movement-toolbar {
  align-items: center;
}

.movement-search-input {
  padding: 9px 12px;
  font-size: 14px;
}

.movement-search-btn {
  padding: 9px 14px;
}

.recent-list {
  display: grid;
  gap: 12px;
}

.recent-item {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.recent-item p {
  margin: 0;
}

.recent-item span {
  color: #0f766e;
  font-weight: 700;
}

.empty-text {
  margin: 0;
  color: var(--muted);
}

.delta-in {
  color: #0f766e;
  font-weight: 700;
}

.delta-out {
  color: #b91c1c;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .movement-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
