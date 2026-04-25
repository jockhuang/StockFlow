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

export type TokenPair = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  refreshExpiresIn: number
}

type QueryValue = string | number | boolean | null | undefined
type QueryParams = Record<string, QueryValue>

export class WarehouseApi {
  private readonly normalizedBaseUrl: string
  private accessToken: string
  private readonly refreshToken: string
  private readonly onTokensRefreshed?: (tokens: TokenPair) => void

  constructor(
    baseUrl: string,
    tokens: { accessToken: string; refreshToken: string },
    onTokensRefreshed?: (tokens: TokenPair) => void,
  ) {
    this.normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
    this.accessToken = tokens.accessToken
    this.refreshToken = tokens.refreshToken
    this.onTokensRefreshed = onTokensRefreshed
  }

  // ── Static auth helpers ────────────────────────────────────────────────────

  static async login(baseUrl: string, username: string, password: string): Promise<TokenPair> {
    const url = `${baseUrl.replace(/\/+$/, '')}/api/auth/login`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Login failed with status ${response.status}.`)
    }

    return (await response.json()) as TokenPair
  }

  static async refresh(baseUrl: string, refreshToken: string): Promise<TokenPair> {
    const url = `${baseUrl.replace(/\/+$/, '')}/api/auth/refresh`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Token refresh failed with status ${response.status}.`)
    }

    return (await response.json()) as TokenPair
  }

  // ── Core request with auto-refresh on 401 ─────────────────────────────────

  async request<T>(path: string, init: RequestInit = {}, secured = true): Promise<T> {
    const response = await this.doFetch(path, init, secured)

    if (response.status === 401 && secured) {
      const tokens = await WarehouseApi.refresh(this.normalizedBaseUrl, this.refreshToken)
      this.accessToken = tokens.accessToken
      this.onTokensRefreshed?.(tokens)

      const retryResponse = await this.doFetch(path, init, secured)
      return this.extractBody(retryResponse)
    }

    return this.extractBody(response)
  }

  private doFetch(path: string, init: RequestInit, secured: boolean): Promise<Response> {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')

    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    if (secured && this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`)
    }

    return fetch(this.buildUrl(path), { ...init, headers })
  }

  private async extractBody<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Request failed with status ${response.status}.`)
    }

    if (response.status === 204) return undefined as T

    return (await response.json()) as T
  }

  // ── API methods ────────────────────────────────────────────────────────────

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
    return this.request<InventoryItem>('/api/inventory-items', { method: 'POST', body: JSON.stringify(payload) })
  }

  updateInventoryItem(id: number, payload: Record<string, unknown>) {
    return this.request<InventoryItem>(`/api/inventory-items/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
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
    return this.request<StockMovement>('/api/inventory-items/movements', { method: 'POST', body: JSON.stringify(payload) })
  }

  listCategories(query: QueryParams) {
    return this.request<PageResponse<Category>>(this.buildPath('/api/categories', query))
  }

  listCategoryOptions() {
    return this.request<SimpleOption[]>('/api/categories/options')
  }

  createCategory(payload: Record<string, unknown>) {
    return this.request<Category>('/api/categories', { method: 'POST', body: JSON.stringify(payload) })
  }

  updateCategory(id: number, payload: Record<string, unknown>) {
    return this.request<Category>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
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
    return this.request<Supplier>('/api/suppliers', { method: 'POST', body: JSON.stringify(payload) })
  }

  updateSupplier(id: number, payload: Record<string, unknown>) {
    return this.request<Supplier>(`/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  }

  deleteSupplier(id: number) {
    return this.request<void>(`/api/suppliers/${id}`, { method: 'DELETE' })
  }

  listPurchaseOrders(query: QueryParams) {
    return this.request<PageResponse<PurchaseOrder>>(this.buildPath('/api/purchase-orders', query))
  }

  createPurchaseOrder(payload: Record<string, unknown>) {
    return this.request<PurchaseOrder>('/api/purchase-orders', { method: 'POST', body: JSON.stringify(payload) })
  }

  receivePurchaseOrder(id: number) {
    return this.request<PurchaseOrder>(`/api/purchase-orders/${id}/receive`, { method: 'POST' })
  }

  listSalesOrders(query: QueryParams) {
    return this.request<PageResponse<SalesOrder>>(this.buildPath('/api/sales-orders', query))
  }

  createSalesOrder(payload: Record<string, unknown>) {
    return this.request<SalesOrder>('/api/sales-orders', { method: 'POST', body: JSON.stringify(payload) })
  }

  shipSalesOrder(id: number) {
    return this.request<SalesOrder>(`/api/sales-orders/${id}/ship`, { method: 'POST' })
  }

  listUsers(query: QueryParams) {
    return this.request<PageResponse<UserItem>>(this.buildPath('/api/users', query))
  }

  createUser(payload: Record<string, unknown>) {
    return this.request<UserItem>('/api/users', { method: 'POST', body: JSON.stringify(payload) })
  }

  updateUser(id: number, payload: Record<string, unknown>) {
    return this.request<UserItem>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
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
    return this.request<RoleItem>('/api/roles', { method: 'POST', body: JSON.stringify(payload) })
  }

  updateRole(id: number, payload: Record<string, unknown>) {
    return this.request<RoleItem>(`/api/roles/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
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
    return this.request<ResourceItem>('/api/resources', { method: 'POST', body: JSON.stringify(payload) })
  }

  updateResource(id: number, payload: Record<string, unknown>) {
    return this.request<ResourceItem>(`/api/resources/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  }

  deleteResource(id: number) {
    return this.request<void>(`/api/resources/${id}`, { method: 'DELETE' })
  }

  private buildUrl(path: string, query?: QueryParams) {
    const url = new URL(`${this.normalizedBaseUrl}${path.startsWith('/') ? path : `/${path}`}`)
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== '' && value != null) url.searchParams.set(key, String(value))
      })
    }
    return url.toString()
  }

  private buildPath(path: string, query?: QueryParams) {
    if (!query) return path
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== '' && value != null) params.set(key, String(value))
    })
    const suffix = params.toString()
    return suffix ? `${path}?${suffix}` : path
  }
}
