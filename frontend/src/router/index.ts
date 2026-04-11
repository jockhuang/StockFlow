import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/InventoryView.vue'),
    },
    {
      path: '/inventory/categories',
      name: 'categories',
      component: () => import('../views/CategoriesView.vue'),
    },
    {
      path: '/inventory/suppliers',
      name: 'suppliers',
      component: () => import('../views/SuppliersView.vue'),
    },
    {
      path: '/inventory/item-suppliers',
      name: 'item-suppliers',
      component: () => import('../views/ItemSupplierRelationsView.vue'),
    },
    {
      path: '/inventory/transactions',
      name: 'transactions',
      component: () => import('../views/TransactionsView.vue'),
    },
    {
      path: '/inventory/purchases',
      name: 'purchases',
      component: () => import('../views/PurchaseOrdersView.vue'),
    },
    {
      path: '/inventory/sales',
      name: 'sales',
      component: () => import('../views/SalesOrdersView.vue'),
    },
    {
      path: '/security/users',
      name: 'users',
      component: () => import('../views/UsersView.vue'),
    },
    {
      path: '/security/roles',
      name: 'roles',
      component: () => import('../views/RolesView.vue'),
    },
    {
      path: '/security/resources',
      name: 'resources',
      component: () => import('../views/ResourcesView.vue'),
    },
  ],
})

export default router
