# Warehouse

A warehouse management and inventory operations system built with Spring Boot and Vue 3. The current implementation covers user and permission management, item master data, suppliers, purchasing, sales, stock movements, inventory cost tracking, and realized profit reporting.

## Tech Stack

- Backend: Spring Boot `4.0.5`, Spring Security, Spring Data JPA
- Frontend: Vue `3.5.31`, TypeScript `6.0.0`, Vite `8.0.3`
- Build: Maven `3.9+`, npm
- Database: MySQL, default database name `warehouse`

## Project Structure

- `backend`: Spring Boot API for RBAC, inventory, purchasing, and sales
- `frontend`: Vue 3 admin application
- `pom.xml`: Maven aggregator entrypoint
- `doc`: supplementary documents

## Implemented Features

### 1. Authentication and Permissions

- Database-backed RBAC model with users, roles, resources, user-role relations, and role-resource relations
- Current authenticated user profile endpoint
- Menus, page actions, and backend APIs are all permission-controlled
- Two seeded roles are included by default:
  - `ADMIN`
  - `OPERATOR`
- Seeded accounts:
  - `admin / Admin@123456`
  - `operator / Operator@123456`

Core permissions currently include:

- `USER_READ / USER_WRITE`
- `ROLE_READ / ROLE_WRITE`
- `RESOURCE_READ / RESOURCE_WRITE`
- `CATEGORY_READ / CATEGORY_WRITE`
- `SUPPLIER_READ / SUPPLIER_WRITE`
- `INVENTORY_READ / INVENTORY_WRITE`
- `INVENTORY_FINANCIAL_READ`
- `ITEM_SUPPLIER_RELATION_READ / ITEM_SUPPLIER_RELATION_WRITE`
- `PURCHASE_ORDER_READ / PURCHASE_ORDER_WRITE`
- `SALES_ORDER_READ / SALES_ORDER_WRITE`
- `INVENTORY_MOVEMENT_READ / INVENTORY_MOVEMENT_WRITE`

`INVENTORY_FINANCIAL_READ` is used to protect financial data visibility. Without this permission, both backend and frontend will hide or omit:

- Avg Cost
- Stock Cost
- Sales Revenue
- Profit
- Total inventory cost and total profit on the dashboard

### 2. Dashboard

- Shows current signed-in user
- Shows backend status and timestamp
- Shows inventory overview:
  - on-hand stock
  - total inventory cost
  - total realized profit
- Displays quick links based on the current user's permissions

### 3. Item Master and Inventory Ledger

- Item master maintenance:
  - SKU
  - name
  - category
  - location
  - opening stock / current stock
- Inventory ledger supports pagination, custom page size, first/last page navigation
- Table lists support clickable column-header sorting with visible sort direction
- Each item row provides quick actions for:
  - Purchase
  - Sale
  - Adjust

### 4. Inventory Definitions

The system currently uses the following stock definitions:

- `On Hand`: physically available stock in warehouse
- `In Transit`: purchased stock not yet received
- `Committed`: sold but not yet shipped
- `Available`: usable stock available for sale or allocation

Both Dashboard and Inventory pages summarize stock using these definitions.

### 5. Category Management

- Create, edit, and delete categories
- Search by code and name
- Pagination and column-header sorting

### 6. Supplier Management

- Create, edit, and delete suppliers
- Maintain contact person, phone, email, address, and description
- Search by code, name, contact, phone, and related fields
- Pagination and column-header sorting

### 7. Item-Supplier Relation Maintenance

- The relation between `inventory-item` and `supplier` is maintained separately
- It is no longer edited inside the item form or supplier form
- A dedicated page is provided to manage allowed suppliers for each item
- During purchase order creation, the supplier dropdown only shows suppliers linked to the selected item

### 8. Purchasing

- Dedicated purchase order page
- Creating a purchase order increases in-transit stock
- Purchase orders support `Confirm Receipt`
- After receipt confirmation:
  - stock moves from in-transit to on-hand
  - a purchase stock movement is created
  - item moving average cost is updated
- Completed purchase orders no longer show action buttons

### 9. Sales

- Dedicated sales order page
- Creating a sales order increases committed quantity
- Sales orders support `Ship`
- After shipment:
  - committed quantity becomes actual outbound stock
  - a sales stock movement is created
  - sales revenue, sales cost, and realized profit are recognized
- Sales do not require supplier selection
- Completed sales orders no longer show action buttons

### 10. Stock Movements and Transaction Details

- `Stock Movements` are displayed on the Inventory page
- A separate `Transactions` page is provided for purchase and sales detail browsing
- Supported filters include:
  - keyword
  - movement type
  - supplier
- Supports pagination, custom page size, first/last page navigation
- Supports column-header sorting
- `Realtime` shows the latest stock activity entries

### 11. Cost and Profit Tracking

Each item currently supports the following financial fields:

- `Avg Cost`
- `Stock Cost`
- `Sales Revenue`
- `Sales Cost`
- `Profit`

Current calculation rules:

- `Avg Cost`: moving average cost
- `Stock Cost`: current on-hand quantity × current moving average cost
- `Profit`: realized profit from shipped sales only

### 12. User, Role, and Resource Management

- User management:
  - create, edit, delete
  - enable / disable
  - assign roles
- Role management:
  - create, edit, delete
  - assign resource permissions
  - group resources by menu/function in the editor
- Resource management:
  - create, edit, delete
  - maintain code, name, HTTP method, path, and description

## Frontend Pages

Current main pages:

- `/`
- `/inventory`
- `/inventory/categories`
- `/inventory/suppliers`
- `/inventory/item-suppliers`
- `/inventory/transactions`
- `/inventory/purchases`
- `/inventory/sales`
- `/security/users`
- `/security/roles`
- `/security/resources`

## Backend API Modules

Current main controllers:

- `AuthController`
- `SystemController`
- `InventoryController`
- `PurchaseOrderController`
- `SalesOrderController`
- `SupplierController`
- `CategoryController`
- `UserController`
- `RoleController`
- `ResourceController`

## Pagination, Search, and Sorting

Current list pages support:

- keyword search
- custom page size
- `First / Previous / Next / Last`
- server-side pagination
- server-side sorting
- clickable table-header sorting with visible active sort direction

Backend pagination endpoints support:

- `page`
- `size`
- `sortBy`
- `sortDir`

## Backend Configuration

Default datasource settings are defined in [backend/src/main/resources/application.properties](/Users/jock/Projects/warehouse/backend/src/main/resources/application.properties):

- URL: `jdbc:mysql://localhost:3306/warehouse`
- Username: `root`
- Password: `123456`

Change these values before using the system in a real environment.

Seed admin account configuration:

- `warehouse.security.seed-admin-username`
- `warehouse.security.seed-admin-password`

## Run Locally

### Start Backend

```bash
cd backend
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home
./mvnw spring-boot:run
```

### Start Frontend

```bash
cd frontend
npm install
npm run dev
```

In development, the frontend proxies `/api/*` to `http://localhost:8080`.

## Build

From the repository root:

```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home
mvn package
```

Frontend build only:

```bash
cd frontend
npm run build
```

Backend tests only:

```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home
mvn -pl backend test
```

## Current Functional Boundaries

This version is already usable as a basic single-warehouse inventory operations system, but it still has clear boundaries:

- Purchase orders and sales orders are still single-item documents, not multi-line documents
- There is no dedicated customer master-data module yet
- Supplier settlement, accounts receivable/payable, invoices, and returns are not implemented
- There is no multi-warehouse, multi-organization, or multi-currency support

The most natural next steps are:

- purchase order header + purchase order lines
- sales order header + sales order lines
- customer management
- inbound/outbound approval workflow
- financial settlement and reporting
