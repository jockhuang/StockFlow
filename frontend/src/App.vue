<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { authState, hasAuthority, initializeAuth, signIn, signOut } from './lib/auth'
import { notificationState, notifyError, remove } from './lib/notify'

const route = useRoute()
const router = useRouter()

const loginForm = reactive({
  username: 'admin',
  password: 'Admin@123456',
})
const loginLoading = ref(false)
const authorityCount = computed(() => authState.profile?.authorities.length ?? 0)
const visibleMenuCount = computed(() => menuGroups.value.reduce((total, group) => total + group.items.length, 0))

const menuGroups = computed(() => {
  const groups = [
    {
      title: 'Workspace',
      items: [{ label: 'Dashboard', to: '/', authority: 'SYSTEM_READ' }],
    },
    {
      title: 'Permission Management',
      items: [
        { label: 'Users', to: '/security/users', authority: 'USER_READ' },
        { label: 'Roles', to: '/security/roles', authority: 'ROLE_READ' },
        { label: 'Resources', to: '/security/resources', authority: 'RESOURCE_READ' },
      ],
    },
    {
      title: 'Inventory Management',
      items: [
        { label: 'Categories', to: '/inventory/categories', authority: 'CATEGORY_READ' },
        { label: 'Suppliers', to: '/inventory/suppliers', authority: 'SUPPLIER_READ' },
        { label: 'Item Suppliers', to: '/inventory/item-suppliers', authority: 'ITEM_SUPPLIER_RELATION_READ' },
        { label: 'Inventory', to: '/inventory', authority: 'INVENTORY_READ' },
        { label: 'Purchases', to: '/inventory/purchases', authority: 'PURCHASE_ORDER_READ' },
        { label: 'Sales', to: '/inventory/sales', authority: 'SALES_ORDER_READ' },
        { label: 'Transactions', to: '/inventory/transactions', authority: 'INVENTORY_MOVEMENT_READ' },
      ],
    },
  ]

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAuthority(item.authority)),
    }))
    .filter((group) => group.items.length > 0)
})

async function submitLogin() {
  loginLoading.value = true

  try {
    await signIn(loginForm.username, loginForm.password)
    const firstTarget = menuGroups.value[0]?.items[0]?.to
    if (firstTarget && !menuGroups.value.some((group) => group.items.some((item) => item.to === route.path))) {
      await router.push(firstTarget)
    }
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Login failed.')
  } finally {
    loginLoading.value = false
  }
}

function logout() {
  signOut()
  void router.push('/')
}

onMounted(async () => {
  await initializeAuth()
  if (authState.username) {
    loginForm.username = authState.username
    loginForm.password = authState.password
  }
})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <p class="eyebrow">Warehouse Suite</p>
        <h1>Admin Console</h1>
      </div>

      <section class="auth-panel">
        <template v-if="authState.profile">
          <div class="auth-head">
            <div>
              <p class="auth-kicker">Current User</p>
              <strong>{{ authState.profile.username }}</strong>
            </div>
            <button class="text-btn" @click="logout">Logout</button>
          </div>
          <dl class="profile-stats">
            <div>
              <dt>Authorities</dt>
              <dd>{{ authorityCount }}</dd>
            </div>
            <div>
              <dt>Menus</dt>
              <dd>{{ visibleMenuCount }}</dd>
            </div>
          </dl>
        </template>
        <template v-else>
          <div class="auth-head">
            <strong>Sign in</strong>
          </div>
          <form class="auth-form" @submit.prevent="submitLogin">
            <input v-model="loginForm.username" placeholder="Username" autocomplete="username" />
            <input
              v-model="loginForm.password"
              type="password"
              placeholder="Password"
              autocomplete="current-password"
            />
            <button class="primary-btn" :disabled="loginLoading" type="submit">
              {{ loginLoading ? 'Signing In...' : 'Sign In' }}
            </button>
          </form>
        </template>
      </section>

      <nav class="menu">
        <section v-for="group in menuGroups" :key="group.title" class="menu-group">
          <p>{{ group.title }}</p>
          <RouterLink v-for="item in group.items" :key="item.to" :to="item.to">
            {{ item.label }}
          </RouterLink>
        </section>
      </nav>
    </aside>

    <main class="content">
      <RouterView />
    </main>

    <div class="toast-layer">
      <article
        v-for="item in notificationState.items"
        :key="item.id"
        class="toast-item"
        :class="`toast-${item.level}`"
      >
        <p>{{ item.message }}</p>
        <button class="toast-close" @click="remove(item.id)">×</button>
      </article>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
}

.sidebar {
  padding: 28px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.92)),
    linear-gradient(145deg, rgba(13, 148, 136, 0.28), transparent 55%);
  color: #e2e8f0;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 24px;
}

.brand h1 {
  margin: 6px 0 0;
  font-size: 2.3rem;
  line-height: 0.92;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.72rem;
  color: #5eead4;
}

.auth-panel {
  border-radius: 24px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.auth-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.auth-kicker {
  margin: 0 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.68rem;
  color: #94a3b8;
}

.auth-form {
  display: grid;
  gap: 10px;
}

.auth-form input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.45);
  color: #f8fafc;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.profile-stats div {
  border-radius: 16px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.34);
}

.profile-stats dt {
  color: #94a3b8;
  font-size: 0.78rem;
}

.profile-stats dd {
  margin: 6px 0 0;
  color: #f8fafc;
  font-weight: 700;
  font-size: 1.05rem;
}

.menu {
  display: grid;
  gap: 20px;
  align-content: start;
}

.menu-group {
  display: grid;
  gap: 10px;
}

.menu-group p {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.72rem;
  color: #94a3b8;
}

.menu-group a {
  color: #cbd5e1;
  text-decoration: none;
  border-radius: 14px;
  padding: 12px 14px;
}

.menu-group a.router-link-exact-active {
  background: rgba(94, 234, 212, 0.14);
  color: #f8fafc;
}

.content {
  padding: 28px;
}

.text-btn {
  border: 0;
  background: transparent;
  color: #5eead4;
  cursor: pointer;
}

.primary-btn {
  border: 0;
  border-radius: 14px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: #f8fafc;
  cursor: pointer;
}

.toast-layer {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 3000;
  display: grid;
  gap: 12px;
  width: min(360px, calc(100vw - 32px));
}

.toast-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: start;
  padding: 14px 16px;
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
  border: 1px solid rgba(148, 163, 184, 0.22);
  backdrop-filter: blur(10px);
}

.toast-item p {
  margin: 0;
  line-height: 1.4;
}

.toast-error {
  background: rgba(127, 29, 29, 0.96);
  color: #fef2f2;
}

.toast-success {
  background: rgba(6, 95, 70, 0.96);
  color: #ecfdf5;
}

.toast-info {
  background: rgba(15, 23, 42, 0.96);
  color: #f8fafc;
}

.toast-close {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

@media (max-width: 960px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .content {
    padding: 20px;
  }

  .toast-layer {
    top: 12px;
    right: 12px;
    left: 12px;
    width: auto;
  }
}
</style>
