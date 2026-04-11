<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { apiFetch, type PageResponse } from '@/lib/api'
import { authState, hasAuthority } from '@/lib/auth'
import { notifyError, notifySuccess } from '@/lib/notify'

type InventoryItem = {
  id: number
  sku: string
  name: string
  quantity: number
  location: string
  categoryId: number
  categoryCode: string
  categoryName: string
  supplierIds: number[]
  supplierNames: string[]
}

type Supplier = {
  id: number
  code: string
  name: string
}

const items = ref<InventoryItem[]>([])
const suppliers = ref<Supplier[]>([])
const keyword = ref('')
const loading = ref(false)
const saving = ref(false)
const page = reactive({ page: 0, size: 12, totalElements: 0, totalPages: 0 })
const sortBy = ref('sku')
const sortDir = ref<'asc' | 'desc'>('asc')
const selectedItemId = ref<number>(0)
const selectedSupplierIds = ref<number[]>([])

const canRead = computed(() => hasAuthority('ITEM_SUPPLIER_RELATION_READ'))
const canWrite = computed(() => hasAuthority('ITEM_SUPPLIER_RELATION_WRITE'))
const selectedItem = computed(() => items.value.find((item) => item.id === selectedItemId.value) ?? null)

async function loadItems(targetPage = page.page) {
  if (!authState.profile || !canRead.value) {
    items.value = []
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
    const response = await apiFetch<PageResponse<InventoryItem>>(`/api/inventory-items/supplier-relations?${query.toString()}`)
    items.value = response.content
    page.page = response.page
    page.size = response.size
    page.totalElements = response.totalElements
    page.totalPages = response.totalPages

    const nextSelected = response.content.find((item) => item.id === selectedItemId.value) ?? response.content[0]
    selectedItemId.value = nextSelected?.id ?? 0
    selectedSupplierIds.value = nextSelected ? [...nextSelected.supplierIds] : []
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load inventory items.')
  } finally {
    loading.value = false
  }
}

function applyPageSize() {
  void loadItems(0)
}

function changeSort(field: string, initialDir: 'asc' | 'desc' = 'asc') {
  if (sortBy.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortDir.value = initialDir
  }

  void loadItems(0)
}

function sortIndicator(field: string) {
  if (sortBy.value !== field) {
    return ''
  }

  return sortDir.value === 'asc' ? '↑' : '↓'
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

async function saveRelations() {
  const item = selectedItem.value
  if (!item) {
    return
  }

  saving.value = true
  try {
    await apiFetch(`/api/inventory-items/${item.id}/supplier-relations`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierIds: selectedSupplierIds.value,
      }),
    })

    notifySuccess('update item supplier relation success')
    await loadItems(page.page)
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to save item supplier relation.')
  } finally {
    saving.value = false
  }
}

watch(selectedItem, (item) => {
  selectedSupplierIds.value = item ? [...item.supplierIds] : []
})

onMounted(() => {
  void Promise.all([loadSuppliers(), loadItems()])
})

watch(
  () => authState.version,
  () => {
    void Promise.all([loadSuppliers(), loadItems(0)])
  },
)
</script>

<template>
  <section class="relation-layout">
    <section class="crud-card">
      <header class="page-header">
        <div>
          <p class="section-label">Inventory Management</p>
          <h2>Item Supplier Relations</h2>
        </div>
      </header>

      <div class="toolbar">
        <input v-model="keyword" class="search-input" placeholder="Search by SKU, name, location, category" />
        <button class="secondary-btn" @click="loadItems(0)">Search</button>
      </div>

      <div class="sort-strip">
        <span class="section-label">Sort</span>
        <button class="sort-button" :class="{ active: sortBy === 'sku' }" @click="changeSort('sku', 'asc')">
          <span>SKU</span>
          <span class="sort-indicator">{{ sortIndicator('sku') }}</span>
        </button>
        <button class="sort-button" :class="{ active: sortBy === 'name' }" @click="changeSort('name', 'asc')">
          <span>Name</span>
          <span class="sort-indicator">{{ sortIndicator('name') }}</span>
        </button>
        <button class="sort-button" :class="{ active: sortBy === 'location' }" @click="changeSort('location', 'asc')">
          <span>Location</span>
          <span class="sort-indicator">{{ sortIndicator('location') }}</span>
        </button>
        <button class="sort-button" :class="{ active: sortBy === 'onHandQuantity' }" @click="changeSort('onHandQuantity', 'desc')">
          <span>On Hand</span>
          <span class="sort-indicator">{{ sortIndicator('onHandQuantity') }}</span>
        </button>
      </div>

      <div class="relation-list">
        <button
          v-for="item in items"
          :key="item.id"
          class="relation-item"
          :class="{ active: item.id === selectedItemId }"
          @click="selectedItemId = item.id"
        >
          <strong>{{ item.sku }} · {{ item.name }}</strong>
          <span>{{ item.categoryName }} · {{ item.location }}</span>
          <small>{{ item.supplierNames.join(', ') || 'No suppliers linked' }}</small>
        </button>
        <p v-if="!loading && items.length === 0" class="empty-cell">No inventory items found.</p>
      </div>

      <PaginationControls
        v-model:page="page.page"
        v-model:size="page.size"
        :total-elements="page.totalElements"
        :total-pages="page.totalPages"
        :disabled="loading"
        @go="loadItems"
        @size-change="applyPageSize"
      />
    </section>

    <aside class="crud-card relation-editor">
      <header class="section-head">
        <div>
          <p class="section-label">Relation Editor</p>
          <h3>{{ selectedItem ? `${selectedItem.sku} · ${selectedItem.name}` : 'Select an item' }}</h3>
        </div>
      </header>

      <div v-if="selectedItem" class="editor-grid">
        <label class="full-width">
          <span>Suppliers</span>
          <div class="checkbox-grid">
            <label v-for="supplier in suppliers" :key="supplier.id" class="check-item">
              <input v-model="selectedSupplierIds" :value="supplier.id" type="checkbox" :disabled="!canWrite" />
              <span>{{ supplier.code }} · {{ supplier.name }}</span>
            </label>
          </div>
        </label>
      </div>
      <p v-else class="empty-cell">Select an inventory item to maintain relations.</p>

      <footer class="editor-actions">
        <button class="primary-btn" :disabled="!canWrite || !selectedItem || saving" @click="saveRelations">
          {{ saving ? 'Saving...' : 'Save Relations' }}
        </button>
      </footer>
    </aside>
  </section>
</template>

<style scoped>
.relation-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 20px;
}

.relation-list {
  display: grid;
  gap: 10px;
}

.sort-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}

.relation-item {
  display: grid;
  gap: 6px;
  text-align: left;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.8);
  padding: 16px;
  cursor: pointer;
}

.relation-item.active {
  border-color: #0f766e;
  background: rgba(20, 184, 166, 0.08);
}

.relation-item span,
.relation-item small {
  color: var(--muted);
}

@media (max-width: 900px) {
  .relation-layout {
    grid-template-columns: 1fr;
  }
}
</style>
