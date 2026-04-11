<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { apiFetch, type PageResponse } from '@/lib/api'
import { authState, hasAuthority } from '@/lib/auth'
import { notifyError, notifySuccess } from '@/lib/notify'

type UserItem = {
  id: number
  username: string
  displayName: string
  enabled: boolean
  roleIds: number[]
  roleCodes: string[]
}

type RoleOption = {
  id: number
  code: string
  name: string
}

const users = ref<UserItem[]>([])
const roles = ref<RoleOption[]>([])
const keyword = ref('')
const loading = ref(false)
const page = reactive({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
const sortBy = ref('username')
const sortDir = ref<'asc' | 'desc'>('asc')
const editingId = ref<number | null>(null)
const showForm = ref(false)
const form = reactive({
  username: '',
  password: '',
  displayName: '',
  enabled: true,
  roleIds: [] as number[],
})

const canWrite = computed(() => hasAuthority('USER_WRITE'))

async function loadRoles() {
  if (!authState.profile || !hasAuthority('ROLE_READ')) {
    roles.value = []
    return
  }

  roles.value = await apiFetch<RoleOption[]>('/api/roles/options')
}

async function loadPage(targetPage = page.page) {
  if (!authState.profile || !hasAuthority('USER_READ')) {
    users.value = []
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
    const response = await apiFetch<PageResponse<UserItem>>(`/api/users?${query.toString()}`)
    users.value = response.content
    page.page = response.page
    page.size = response.size
    page.totalElements = response.totalElements
    page.totalPages = response.totalPages
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load users.')
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
  form.username = ''
  form.password = ''
  form.displayName = ''
  form.enabled = true
  form.roleIds = []
}

function startCreate() {
  resetForm()
  showForm.value = true
}

function startEdit(user: UserItem) {
  editingId.value = user.id
  form.username = user.username
  form.password = ''
  form.displayName = user.displayName
  form.enabled = user.enabled
  form.roleIds = [...user.roleIds]
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  resetForm()
}

async function save() {
  if (editingId.value == null && !form.password.trim()) {
    notifyError('Password is required when creating a user.')
    return
  }

  const isCreate = editingId.value == null
  const payload = {
    username: form.username,
    password: form.password,
    displayName: form.displayName,
    enabled: form.enabled,
    roleIds: form.roleIds,
  }

  try {
    if (isCreate) {
      await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch(`/api/users/${editingId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    showForm.value = false
    resetForm()
    notifySuccess(isCreate ? 'create user success' : 'update user success')
    await loadPage()
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to save user.')
  }
}

async function remove(id: number) {
  try {
    await apiFetch(`/api/users/${id}`, { method: 'DELETE' })
    notifySuccess('User deleted.')
    await loadPage()
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to delete user.')
  }
}

onMounted(() => {
  void Promise.all([loadRoles(), loadPage()])
})

watch(
  () => authState.version,
  () => {
    void Promise.all([loadRoles(), loadPage(0)])
  },
)
</script>

<template>
  <section class="crud-card">
    <header class="page-header">
      <div>
        <p class="section-label">Permission Management</p>
        <h2>Users</h2>
      </div>
      <button v-if="canWrite" class="primary-btn" @click="startCreate">New User</button>
    </header>

    <div class="toolbar">
      <input v-model="keyword" class="search-input" placeholder="Search by username or display name" />
      <button class="secondary-btn" @click="loadPage(0)">Search</button>
    </div>

    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'username' }" @click="changeSort('username', 'asc')">
                <span>Username</span>
                <span class="sort-indicator">{{ sortIndicator('username') }}</span>
              </button>
            </th>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'displayName' }" @click="changeSort('displayName', 'asc')">
                <span>Display Name</span>
                <span class="sort-indicator">{{ sortIndicator('displayName') }}</span>
              </button>
            </th>
            <th>
              <button class="sort-button" :class="{ active: sortBy === 'enabled' }" @click="changeSort('enabled', 'desc')">
                <span>Status</span>
                <span class="sort-indicator">{{ sortIndicator('enabled') }}</span>
              </button>
            </th>
            <th>Roles</th>
            <th v-if="canWrite">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.username }}</td>
            <td>{{ user.displayName }}</td>
            <td>{{ user.enabled ? 'Enabled' : 'Disabled' }}</td>
            <td>{{ user.roleCodes.join(', ') }}</td>
            <td v-if="canWrite">
              <div class="row-actions">
                <button class="inline-btn" @click="startEdit(user)">Edit</button>
                <button class="inline-btn danger" @click="remove(user.id)">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && users.length === 0">
            <td :colspan="canWrite ? 5 : 4" class="empty-cell">No users found.</td>
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
          <h3>{{ editingId == null ? 'Create User' : 'Edit User' }}</h3>
        </div>
        <button class="inline-btn" @click="closeForm">Close</button>
      </header>

      <div class="editor-grid wide">
        <label><span>Username</span><input v-model="form.username" /></label>
        <label><span>Password</span><input v-model="form.password" type="password" placeholder="Keep blank to preserve on edit" /></label>
        <label><span>Display Name</span><input v-model="form.displayName" /></label>
        <label class="toggle-field"><span>Enabled</span><input v-model="form.enabled" type="checkbox" /></label>
        <label class="full-width">
          <span>Roles</span>
          <div class="checkbox-grid">
            <label v-for="role in roles" :key="role.id" class="check-item">
              <input v-model="form.roleIds" :value="role.id" type="checkbox" />
              <span>{{ role.code }} · {{ role.name }}</span>
            </label>
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
