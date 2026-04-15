import type {
  Category,
  InventoryItem,
  InventorySummary,
  PageResponse,
  PurchaseOrder,
  ResourceItem,
  RoleItem,
  SalesOrder,
  SimpleOption,
  StockMovement,
  Supplier,
  SystemSummary,
  UserItem,
  UserProfile,
} from '../types'

type Credentials = {
  username: string
  password: string
}

type QueryValue = string | number | boolean | null | undefined

type QueryParams = Record<string, QueryValue>

export class WarehouseApi {
  private readonly normalizedBaseUrl: string

  constructor(
    baseUrl: string,
    private readonly credentials?: Credentials,
  ) {
    this.normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  }

  private buildUrl(path: string, query?: QueryParams) {
    const url = new URL(`${this.normalizedBaseUrl}${path.startsWith('/') ? path : `/${path}`}`)
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== '' && value != null) {
          url.searchParams.set(key, String(value))
        }
      })
    }
    return url.toString()
  }

  private authorizationHeader() {
    if (!this.credentials) {
      return ''
    }
    return `Basic ${encodeBase64(`${this.credentials.username}:${this.credentials.password}`)}`
  }

  async request<T>(path: string, init: RequestInit = {}, secured = true): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')

    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    if (secured) {
      const authHeader = this.authorizationHeader()
      if (authHeader) {
        headers.set('Authorization', authHeader)
      }
    }

    const response = await fetch(this.buildUrl(path), {
      ...init,
      headers,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Request failed with status ${response.status}.`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  me() {
    return this.request<UserProfile>('/api/auth/me')
  }

  getSystemSummary() {
    return this.request<SystemSummary>('/api/system/summary')
  }

  getInventorySummary() {
    return this.request<InventorySummary>('/api/inventory-items/summary')
  }

  listInventory(query: QueryParams) {
    return this.request<PageResponse<InventoryItem>>(this.buildPath('/api/inventory-items', query))
  }

  listInventorySupplierRelations(query: QueryParams) {
    return this.request<PageResponse<InventoryItem>>(this.buildPath('/api/inventory-items/supplier-relations', query))
  }

  createInventoryItem(payload: Record<string, unknown>) {
    return this.request<InventoryItem>('/api/inventory-items', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  updateInventoryItem(id: number, payload: Record<string, unknown>) {
    return this.request<InventoryItem>(`/api/inventory-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  deleteInventoryItem(id: number) {
    return this.request<void>(`/api/inventory-items/${id}`, { method: 'DELETE' })
  }

  updateSupplierRelations(id: number, supplierIds: number[]) {
    return this.request<InventoryItem>(`/api/inventory-items/${id}/supplier-relations`, {
      method: 'PUT',
      body: JSON.stringify({ supplierIds }),
    })
  }

  listMovements(query: QueryParams) {
    return this.request<PageResponse<StockMovement>>(this.buildPath('/api/inventory-items/movements', query))
  }

  recordMovement(payload: Record<string, unknown>) {
    return this.request<StockMovement>('/api/inventory-items/movements', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  listCategories(query: QueryParams) {
    return this.request<PageResponse<Category>>(this.buildPath('/api/categories', query))
  }

  listCategoryOptions() {
    return this.request<SimpleOption[]>('/api/categories/options')
  }

  createCategory(payload: Record<string, unknown>) {
    return this.request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  updateCategory(id: number, payload: Record<string, unknown>) {
    return this.request<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  deleteCategory(id: number) {
    return this.request<void>(`/api/categories/${id}`, { method: 'DELETE' })
  }

  listSuppliers(query: QueryParams) {
    return this.request<PageResponse<Supplier>>(this.buildPath('/api/suppliers', query))
  }

  listSupplierOptions() {
    return this.request<SimpleOption[]>('/api/suppliers/options')
  }

  createSupplier(payload: Record<string, unknown>) {
    return this.request<Supplier>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  updateSupplier(id: number, payload: Record<string, unknown>) {
    return this.request<Supplier>(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  deleteSupplier(id: number) {
    return this.request<void>(`/api/suppliers/${id}`, { method: 'DELETE' })
  }

  listPurchaseOrders(query: QueryParams) {
    return this.request<PageResponse<PurchaseOrder>>(this.buildPath('/api/purchase-orders', query))
  }

  createPurchaseOrder(payload: Record<string, unknown>) {
    return this.request<PurchaseOrder>('/api/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  receivePurchaseOrder(id: number) {
    return this.request<PurchaseOrder>(`/api/purchase-orders/${id}/receive`, { method: 'POST' })
  }

  listSalesOrders(query: QueryParams) {
    return this.request<PageResponse<SalesOrder>>(this.buildPath('/api/sales-orders', query))
  }

  createSalesOrder(payload: Record<string, unknown>) {
    return this.request<SalesOrder>('/api/sales-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  shipSalesOrder(id: number) {
    return this.request<SalesOrder>(`/api/sales-orders/${id}/ship`, { method: 'POST' })
  }

  listUsers(query: QueryParams) {
    return this.request<PageResponse<UserItem>>(this.buildPath('/api/users', query))
  }

  createUser(payload: Record<string, unknown>) {
    return this.request<UserItem>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  updateUser(id: number, payload: Record<string, unknown>) {
    return this.request<UserItem>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  deleteUser(id: number) {
    return this.request<void>(`/api/users/${id}`, { method: 'DELETE' })
  }

  listRoles(query: QueryParams) {
    return this.request<PageResponse<RoleItem>>(this.buildPath('/api/roles', query))
  }

  listRoleOptions() {
    return this.request<SimpleOption[]>('/api/roles/options')
  }

  createRole(payload: Record<string, unknown>) {
    return this.request<RoleItem>('/api/roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  updateRole(id: number, payload: Record<string, unknown>) {
    return this.request<RoleItem>(`/api/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  deleteRole(id: number) {
    return this.request<void>(`/api/roles/${id}`, { method: 'DELETE' })
  }

  listResources(query: QueryParams) {
    return this.request<PageResponse<ResourceItem>>(this.buildPath('/api/resources', query))
  }

  listResourceOptions() {
    return this.request<SimpleOption[]>('/api/resources/options')
  }

  createResource(payload: Record<string, unknown>) {
    return this.request<ResourceItem>('/api/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  updateResource(id: number, payload: Record<string, unknown>) {
    return this.request<ResourceItem>(`/api/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  deleteResource(id: number) {
    return this.request<void>(`/api/resources/${id}`, { method: 'DELETE' })
  }

  private buildPath(path: string, query?: QueryParams) {
    if (!query) {
      return path
    }

    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== '' && value != null) {
        params.set(key, String(value))
      }
    })

    const suffix = params.toString()
    return suffix ? `${path}?${suffix}` : path
  }
}

function encodeBase64(value: string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const utf8 = encodeUtf8(value)
  let result = ''

  for (let index = 0; index < utf8.length; index += 3) {
    const byte1 = utf8.charCodeAt(index)
    const hasByte2 = index + 1 < utf8.length
    const hasByte3 = index + 2 < utf8.length
    const byte2 = hasByte2 ? utf8.charCodeAt(index + 1) : 0
    const byte3 = hasByte3 ? utf8.charCodeAt(index + 2) : 0

    const block = (byte1 << 16) | (byte2 << 8) | byte3
    result += chars[(block >> 18) & 63]
    result += chars[(block >> 12) & 63]
    result += hasByte2 ? chars[(block >> 6) & 63] : '='
    result += hasByte3 ? chars[block & 63] : '='
  }

  return result
}

function encodeUtf8(value: string) {
  return encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16)),
  )
}
