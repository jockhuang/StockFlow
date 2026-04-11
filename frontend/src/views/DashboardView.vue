<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { apiFetch } from '@/lib/api'
import { authState, hasAuthority } from '@/lib/auth'
import { notifyError } from '@/lib/notify'

type SystemSummary = {
  application: string
  status: string
  timestamp: string
}

type InventorySummary = {
  totalItems: number
  totalOnHandQuantity: number
  totalInventoryCost: number | null
  totalSalesProfit: number | null
}

const summary = ref<SystemSummary | null>(null)
const inventorySummary = ref<InventorySummary | null>(null)
const canViewFinancials = computed(() => hasAuthority('INVENTORY_FINANCIAL_READ'))

const quickLinks = computed(() => [
  { label: 'Users', path: '/security/users', authority: 'USER_READ' },
  { label: 'Roles', path: '/security/roles', authority: 'ROLE_READ' },
  { label: 'Resources', path: '/security/resources', authority: 'RESOURCE_READ' },
  { label: 'Categories', path: '/inventory/categories', authority: 'CATEGORY_READ' },
  { label: 'Suppliers', path: '/inventory/suppliers', authority: 'SUPPLIER_READ' },
  { label: 'Item Suppliers', path: '/inventory/item-suppliers', authority: 'ITEM_SUPPLIER_RELATION_READ' },
  { label: 'Inventory', path: '/inventory', authority: 'INVENTORY_READ' },
  { label: 'Purchases', path: '/inventory/purchases', authority: 'PURCHASE_ORDER_READ' },
  { label: 'Sales', path: '/inventory/sales', authority: 'SALES_ORDER_READ' },
  { label: 'Transactions', path: '/inventory/transactions', authority: 'INVENTORY_MOVEMENT_READ' },
].filter((item) => hasAuthority(item.authority)))

async function loadSummary() {
  summary.value = null
  inventorySummary.value = null

  if (!authState.profile || !hasAuthority('SYSTEM_READ')) {
    if (!hasAuthority('INVENTORY_READ')) {
      return
    }
  }

  try {
    const tasks: Promise<unknown>[] = []

    if (hasAuthority('SYSTEM_READ')) {
      tasks.push(
        apiFetch<SystemSummary>('/api/system/summary').then((response) => {
          summary.value = response
        }),
      )
    }

    if (hasAuthority('INVENTORY_READ')) {
      tasks.push(
        apiFetch<InventorySummary>('/api/inventory-items/summary').then((response) => {
          inventorySummary.value = response
        }),
      )
    }

    await Promise.all(tasks)
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load dashboard.')
  }
}

onMounted(() => {
  void loadSummary()
})

watch(
  () => authState.version,
  () => {
    void loadSummary()
  },
)
</script>

<template>
  <section class="page-card">
    <div class="page-heading">
      <div>
        <p class="section-label">Dashboard</p>
        <h2>Warehouse control center</h2>
      </div>
    </div>

    <div class="stats-grid">
      <article>
        <span>Current user</span>
        <strong>{{ authState.profile?.username ?? 'Not signed in' }}</strong>
      </article>
      <article>
        <span>Backend status</span>
        <strong>{{ summary?.status ?? '-' }}</strong>
      </article>
      <article>
        <span>Timestamp</span>
        <strong>{{ summary?.timestamp ?? '-' }}</strong>
      </article>
      <article v-if="hasAuthority('INVENTORY_READ')">
        <span>On-hand stock</span>
        <strong>{{ inventorySummary?.totalOnHandQuantity ?? 0 }}</strong>
      </article>
      <article v-if="hasAuthority('INVENTORY_READ') && canViewFinancials">
        <span>Total inventory cost</span>
        <strong>{{ inventorySummary?.totalInventoryCost?.toFixed(2) ?? '-' }}</strong>
      </article>
      <article v-if="hasAuthority('INVENTORY_READ') && canViewFinancials">
        <span>Total profit</span>
        <strong>{{ inventorySummary?.totalSalesProfit?.toFixed(2) ?? '-' }}</strong>
      </article>
    </div>

    <div class="quick-links">
      <RouterLink v-for="item in quickLinks" :key="item.path" :to="item.path" class="quick-link">
        {{ item.label }}
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.page-card {
  display: grid;
  gap: 24px;
}

.page-heading h2 {
  margin: 8px 0 0;
}

.section-label {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.72rem;
  color: #0f766e;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.stats-grid article {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  padding: 18px;
}

.stats-grid span {
  display: block;
  color: #64748b;
  font-size: 0.85rem;
}

.stats-grid strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 1.08rem;
}

.quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.quick-link {
  border-radius: 999px;
  background: #0f766e;
  color: #f8fafc;
  padding: 12px 16px;
  text-decoration: none;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
