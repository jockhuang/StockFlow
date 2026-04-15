export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type UserProfile = {
  username: string
  authorities: string[]
}

export type SystemSummary = {
  application: string
  status: string
  timestamp: string
}

export type InventorySummary = {
  totalItems: number
  totalStockQuantity?: number
  totalOnHandQuantity: number
  totalInTransitQuantity?: number
  totalCommittedQuantity?: number
  totalAvailableQuantity?: number
  lowStockItems?: number
  totalPurchaseQuantity?: number
  totalSaleQuantity?: number
  totalInventoryCost: number | null
  totalSalesRevenue?: number | null
  totalSalesCost?: number | null
  totalSalesProfit: number | null
  recentMovements?: StockMovement[]
}

export type InventoryItem = {
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

export type StockMovement = {
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

export type Category = {
  id: number
  code: string
  name: string
  description: string
}

export type Supplier = {
  id: number
  code: string
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  description: string | null
  inventoryItemIds: number[]
  inventoryItemNames: string[]
}

export type SimpleOption = {
  id: number
  code: string
  name: string
}

export type PurchaseOrder = {
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

export type SalesOrder = {
  id: number
  inventoryItemId: number
  inventorySku: string
  inventoryName: string
  quantity: number
  unitPrice: number | null
  customerName: string | null
  referenceNo: string | null
  remark: string | null
  status: string
  createdAt: string
  shippedAt: string | null
}

export type UserItem = {
  id: number
  username: string
  displayName: string
  enabled: boolean
  roleIds: number[]
  roleCodes: string[]
}

export type RoleItem = {
  id: number
  code: string
  name: string
  description: string
  resourceIds: number[]
  resourceCodes: string[]
}

export type ResourceItem = {
  id: number
  code: string
  name: string
  path: string
  httpMethod: string
  description: string
}
