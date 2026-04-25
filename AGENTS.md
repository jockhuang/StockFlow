# AGENTS.md - AI Coding Agent Guide for StockFlow

## Project Overview

**StockFlow** is a warehouse management system with three integrated frontends:
- **Backend**: Spring Boot 4.0.5 REST API with database-driven RBAC
- **Frontend**: Vue 3 admin dashboard
- **Mobile**: Expo React Native for iOS/Android

The system models single-item purchase/sales orders, inventory ledger tracking, moving average costing, and permission-controlled financial visibility.

## Architecture & Key Files

### Core Business Logic

**Stock Definitions** (essential to all inventory operations):
- `onHandQuantity`: physically available stock
- `inTransitQuantity`: purchased but not received
- `committedQuantity`: sold but not shipped
- `availableQuantity`: calculated as `onHandQuantity - committedQuantity`

See `README.md` lines 83-91 for full definitions.

**Data Flow Patterns**:
1. **Purchase**: Create order → inTransitQuantity +1 → Receive → onHandQuantity +1, update `averageUnitCost`
2. **Sales**: Create order → committedQuantity +1 → Ship → onHandQuantity -1, recognize profit
3. **Adjustment**: Direct quantity change via `StockMovementType.ADJUSTMENT_IN/OUT`

Key entities: `InventoryItem`, `PurchaseOrder`, `SalesOrder`, `StockMovement` (audit trail)

### Permission Model

**RBAC Schema**: User → Role → Resources (permissions)
- Seeded roles: `ADMIN` (all permissions), `OPERATOR` (read-mostly)
- Seeded accounts: `admin/Admin@123456`, `operator/Operator@123456`
- Core permission pattern: `ENTITY_READ` / `ENTITY_WRITE`
- Special: `INVENTORY_FINANCIAL_READ` hides cost/revenue/profit from UI and API responses

**Permission Enforcement**:
- Backend: `@PreAuthorize("hasAuthority('PERMISSION_CODE')")` on controller methods
- Frontend: `hasAuthority()` checks before rendering menu items, showing forms, API calls
- Mobile: Same patterns as frontend

See `backend/src/main/resources/application.properties` lines 20-21 for seeding config.

### Search & Pagination

**Full-Text Search** (`SearchKeywordSupport`, `InventoryItemRepository`):
- Min word length 3 chars for MySQL FTS
- Words < 3 chars fall back to LIKE with `search_text` column
- Search corpus = item name + category name (denormalized, maintained by service)
- Controller passes normalized keyword to repository

**Pagination** (standard across all list endpoints):
```
GET /api/{entity}?page=0&size=10&sortBy=id&sortDir=desc&keyword=...
```
- Server-side sorting via whitelist (e.g., `ALLOWED_SORT_FIELDS` in each service)
- Response: `PageResponse<T>` record with content, page, size, totalElements, totalPages
- Secondary sort by `id DESC` always applied (for consistency)

### Request/Response Patterns

**DTOs are records** (Java 17+) with mapping logic in controllers:
```java
PageResponse.from(page, item -> ItemResponse.from(item, includeFinancials))
```

Controllers transform domain entities → DTOs, applying:
- Financial field filtering based on permissions
- Nested object resolution (e.g., supplier IDs → names)
- Validation via `@Valid` + bean validation annotations

Example: `InventoryResponse.from()` checks `INVENTORY_FINANCIAL_READ` permission and omits cost fields if absent.

## Development Workflows

### Backend Development

**Start Development Server**:
```bash
cd backend
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home
./mvnw spring-boot:run
```
- Runs on `http://localhost:8080`
- Flyway auto-migrations on startup
- Uses MySQL `warehouse` database (default: root/just4you)

**Database Configuration** (`application.properties`):
- URL: `jdbc:mysql://localhost:3306/warehouse`
- Seed admin credentials in properties (lines 20-21)
- Migrations in `db/migration/` (V1, V2, V3, etc.)

**Testing**:
```bash
mvn -pl backend test
```
- Uses H2 in-memory DB
- Spring Boot test starters included

### Frontend Development

**Start Dev Server**:
```bash
cd frontend
npm install
npm run dev
```
- Vite dev server on `http://localhost:5173` (typical)
- Proxies `/api/*` to `http://localhost:8080` (see `vite.config.ts`)
- Hot module replacement enabled
- Credentials stored in `localStorage` under key `warehouse-auth`

**Commands**:
- `npm run dev`: Dev server with HMR
- `npm run build`: Production build
- `npm run type-check`: TypeScript validation
- `npm run test:unit`: Vitest
- `npm run test:e2e`: Playwright tests
- `npm run lint`: ESLint + Oxlint with auto-fix

### Mobile Development

**Start Expo Dev Server**:
```bash
cd mobile
npm install
npm run start
```

**Run on Simulators/Devices**:
```bash
npm run ios      # iOS simulator
npm run android  # Android emulator
```

**API Base URL Configuration** (`app.json` `extra.apiBaseUrl`):
- iOS Simulator: `http://localhost:8080`
- Android Emulator: `http://10.0.2.2:8080` (host gateway)
- Physical device: LAN IP (e.g., `http://192.168.1.20:8080`)

### Build & Release

**Full Build** (from repo root):
```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home
mvn package
```

**Skip Mobile** (faster):
```bash
mvn package -Dmobile.skip=true
```

**Frontend Only**:
```bash
cd frontend && npm run build
```

**Mobile Only**:
```bash
mvn -pl mobile package
```

### API Testing

Use **Bruno** (`doc/bruno/`):
1. Open `doc/bruno` folder in Bruno app
2. Select `local` environment
3. Configure baseUrl, username, password in `local.bru`
4. Secured endpoints use Basic Auth (environment variables)

Key endpoints documented in `doc/README.md`.

## Project-Specific Patterns

### Service Layer Conventions

**@Transactional** by default on services; use `@Transactional(readOnly=true)` for queries:
```java
@Service
@Transactional
public class InventoryService {
    @Transactional(readOnly = true)
    public Page<InventoryItem> findPage(...) { ... }
}
```

**Sorted Fetching with Whitelist**:
```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "sku", "name");
Sort sort = SortSupport.resolveSort(sortBy, sortDir, "id", ALLOWED_SORT_FIELDS);
```

**Lazy Initialization** (avoid N+1):
```java
Hibernate.initialize(item.getSuppliers());  // After query, before transaction closes
```

### Controller Method Signature

Standard pattern for paginated endpoints:
```java
@GetMapping
@PreAuthorize("hasAuthority('ENTITY_READ')")
public PageResponse<ResponseDTO> findPage(
    @RequestParam(defaultValue = "") String keyword,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size,
    @RequestParam(defaultValue = "id") String sortBy,
    @RequestParam(defaultValue = "desc") String sortDir,
    Authentication authentication) {
    boolean includeFinancials = hasFinancialRead(authentication);
    return PageResponse.from(service.findPage(...), item -> ResponseDTO.from(item, includeFinancials));
}
```

### Frontend API Client

**apiFetch** (`lib/api.ts`) pattern:
```typescript
await apiFetch<T>(path, {method: 'POST', body: JSON.stringify(data)})
// Auto-adds: Basic auth header, Accept: application/json
// Throws on non-2xx, returns typed content or undefined for 204
```

**State Management**: Auth state in `lib/auth.ts` (reactive object), credentials in localStorage.

**Page Component Pattern**:
- Reactive state: `keyword`, `page`, `size`, `sortBy`, `sortDir`, `items`, `loading`
- Watchers for keyword/pagination changes trigger API calls
- `PaginationControls.vue` component handles first/prev/next/last logic (0-indexed)
- Financial data visibility checked before rendering (permission-aware components)

### Entity-Supplier Relations

**Important Architectural Decision**:
- Item ↔ Supplier is a **separate many-to-many** relation
- NOT edited inside item form or supplier form
- Dedicated page `/inventory/item-suppliers` for maintenance
- Purchase supplier dropdown auto-filtered to linked suppliers only

See `InventoryItem.java` lines 60-67 for JoinTable config.

### Stock Movement Audit Trail

Every stock change creates a `StockMovement` entry:
- Type: `PURCHASE_IN`, `PURCHASE_OUT`, `SALES_IN`, `SALES_OUT`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`
- Contains reference to item, supplier (if applicable), quantity delta, unit price, timestamp
- Service creates via `StockMovementService.createMovement()`
- Visible in `/inventory/transactions` with keyword/type/supplier filters

### Financial Fields & Permission Control

**Hidden Fields** (when `!INVENTORY_FINANCIAL_READ`):
- Item: `averageUnitCost`, `inventoryCost`, `totalSalesRevenue`, `totalSalesCost`, `totalSalesProfit`
- Dashboard: total inventory cost, total profit
- Transactions: pricing details

**Implementation**: DTOs include conditional logic, controllers check permission, frontend hides UI elements.

## Database & Migrations

**Flyway Migrations** run automatically on startup:
- Located in `backend/src/main/resources/db/migration/`
- Named `V{n}__{description}.sql`
- Last migration adds UTF-8 support for search

**Schema Highlights**:
- `inventory_item`: Multi-quantity columns (onHand, inTransit, committed), financial fields
- `inventory_item_supplier`: Join table for many-to-many
- `stock_movement`: Audit trail with movement type and pricing
- `user_account`, `role`, `resource`: RBAC entities
- `purchase_order`, `sales_order`: Single-item documents (future: multi-line)

## Critical Cross-Component Flows

### New Feature: Adding a Read-Only Entity Page

1. **Backend**:
   - Create entity (e.g., `entity/NewEntity.java`)
   - Create repository (Spring Data JPA)
   - Create service with `findPage()`, `findById()`, and standard ALLOWED_SORT_FIELDS
   - Create `NewEntityResponse` DTO
   - Create controller with `@GetMapping`, `@PreAuthorize("NEW_ENTITY_READ")`, map via `PageResponse.from()`
   - Add permission to database (insert into `resource` table)
   - Create Flyway migration if schema changes

2. **Frontend**:
   - Create view component (`views/NewEntityView.vue`)
   - Import `PaginationControls`, `apiFetch`, `authState`
   - Setup keyword/page/size watchers, call service.findPage()
   - Render table with reusable header columns
   - Add route in `router/index.ts`
   - Add menu link in main layout (conditionally check `hasAuthority()`)

3. **Mobile**:
   - Mirror frontend screen structure (React Native components instead of Vue)
   - Use same API endpoints

### Common Error Patterns

**Full-Text Search Errors**:
- If MySQL FTS disabled: Check migration V1 or MySQL configuration
- If short keywords (< 3 chars) return empty: Falls back to LIKE, ensure `search_text` column populated

**Permission Denied on Valid Account**:
- Verify user has role assigned
- Verify role has resource (permission) assigned
- Check permission code matches `@PreAuthorize` string
- Clear browser cache (auth cached in localStorage)

**API Response 204 (No Content)**:
- DELETE endpoints return 204; apiFetch handles via `return undefined`

**Sorting Not Working**:
- Verify sort field in request is in service's ALLOWED_SORT_FIELDS set
- Secondary sort always by ID DESC

## Testing Conventions

**Backend Integration Tests**:
- Use Spring Boot test context with H2 in-memory DB
- Example: `WarehouseBackendApplicationTests.java`
- Run via `mvn -pl backend test`

**Frontend Unit Tests** (Vitest):
- Component tests with `@vue/test-utils`
- Mock API calls with vitest mocks
- Run via `npm run test:unit`

**E2E Tests**:
- Playwright (`test:e2e`) or Cypress (`test:e2e:dev`)
- Tests against live dev server
- Run via `npm run test:e2e`

## Key Configuration Files

| File | Purpose |
|------|---------|
| `pom.xml` (root) | Maven aggregator, modules declaration |
| `backend/pom.xml` | Spring Boot dependencies (JPA, Security, Actuator) |
| `backend/application.properties` | DB connection, Flyway, admin seeding |
| `frontend/vite.config.ts` | Dev proxy, Vue plugin, alias |
| `frontend/package.json` | npm scripts (dev, build, lint, test) |
| `mobile/app.json` | Expo config, API base URL |
| `doc/bruno/environments/local.bru` | API test credentials |
| `README.md` | Feature overview, tech stack, run instructions |

## External Dependencies & Integrations

- **MySQL**: Relational DB, must be running before backend startup
- **Spring Security**: HTTP Basic auth, permission checking
- **Spring Data JPA / Hibernate**: ORM, lazy loading + eager initialization patterns
- **Flyway**: DB migrations
- **Vite**: Frontend bundler with hot reload
- **Expo**: Mobile app framework (uses Metro bundler)
- **Bruno**: API testing tool (alternative to Postman)

---

**Last Updated**: 2026-04-26
**Tech Stack**: Spring Boot 4.0.5 | Vue 3.5.31 | Expo 53 | Maven 3.9+

