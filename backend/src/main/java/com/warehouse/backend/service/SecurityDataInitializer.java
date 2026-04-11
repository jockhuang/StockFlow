package com.warehouse.backend.service;

import com.warehouse.backend.config.SecuritySeedProperties;
import com.warehouse.backend.entity.ResourceEntity;
import com.warehouse.backend.entity.Role;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SecurityDataInitializer implements CommandLineRunner {

    private final ResourceService resourceService;
    private final RoleService roleService;
    private final UserService userService;
    private final InventoryService inventoryService;
    private final CategoryService categoryService;
    private final SupplierService supplierService;
    private final SecuritySeedProperties securitySeedProperties;

    public SecurityDataInitializer(ResourceService resourceService,
                                   RoleService roleService,
                                   UserService userService,
                                   InventoryService inventoryService,
                                   CategoryService categoryService,
                                   SupplierService supplierService,
                                   SecuritySeedProperties securitySeedProperties) {
        this.resourceService = resourceService;
        this.roleService = roleService;
        this.userService = userService;
        this.inventoryService = inventoryService;
        this.categoryService = categoryService;
        this.supplierService = supplierService;
        this.securitySeedProperties = securitySeedProperties;
    }

    @Override
    public void run(String... args) {
        ResourceEntity authProfileRead = resourceService.upsertSeed("AUTH_PROFILE_READ", "Current user", "/api/auth/me", "GET", "Current authenticated user");
        ResourceEntity systemRead = resourceService.upsertSeed("SYSTEM_READ", "System summary", "/api/system/summary", "GET", "View system dashboard");
        ResourceEntity inventoryRead = resourceService.upsertSeed("INVENTORY_READ", "Inventory list", "/api/inventory-items", "GET", "List inventory items");
        ResourceEntity inventoryWrite = resourceService.upsertSeed("INVENTORY_WRITE", "Inventory write", "/api/inventory-items", "POST", "Create and edit inventory items");
        ResourceEntity inventoryFinancialRead = resourceService.upsertSeed("INVENTORY_FINANCIAL_READ", "Inventory financial read", "/api/inventory-items", "GET", "View inventory cost and profit data");
        ResourceEntity itemSupplierRelationRead = resourceService.upsertSeed("ITEM_SUPPLIER_RELATION_READ", "Item supplier relation list", "/api/inventory-items", "GET", "View item supplier relations");
        ResourceEntity itemSupplierRelationWrite = resourceService.upsertSeed("ITEM_SUPPLIER_RELATION_WRITE", "Item supplier relation write", "/api/inventory-items/{id}/supplier-relations", "PUT", "Maintain item supplier relations");
        ResourceEntity purchaseOrderRead = resourceService.upsertSeed("PURCHASE_ORDER_READ", "Purchase order list", "/api/purchase-orders", "GET", "List purchase orders");
        ResourceEntity purchaseOrderWrite = resourceService.upsertSeed("PURCHASE_ORDER_WRITE", "Purchase order write", "/api/purchase-orders", "POST", "Create and receive purchase orders");
        ResourceEntity salesOrderRead = resourceService.upsertSeed("SALES_ORDER_READ", "Sales order list", "/api/sales-orders", "GET", "List sales orders");
        ResourceEntity salesOrderWrite = resourceService.upsertSeed("SALES_ORDER_WRITE", "Sales order write", "/api/sales-orders", "POST", "Create and ship sales orders");
        ResourceEntity inventoryMovementRead = resourceService.upsertSeed("INVENTORY_MOVEMENT_READ", "Stock movement list", "/api/inventory-items/movements", "GET", "List stock movements");
        ResourceEntity inventoryMovementWrite = resourceService.upsertSeed("INVENTORY_MOVEMENT_WRITE", "Stock movement write", "/api/inventory-items/movements", "POST", "Record purchase, sale, and stock adjustment");
        ResourceEntity supplierRead = resourceService.upsertSeed("SUPPLIER_READ", "Supplier list", "/api/suppliers", "GET", "List suppliers");
        ResourceEntity supplierWrite = resourceService.upsertSeed("SUPPLIER_WRITE", "Supplier write", "/api/suppliers", "POST", "Create and edit suppliers");
        ResourceEntity categoryRead = resourceService.upsertSeed("CATEGORY_READ", "Category list", "/api/categories", "GET", "List inventory categories");
        ResourceEntity categoryWrite = resourceService.upsertSeed("CATEGORY_WRITE", "Category write", "/api/categories", "POST", "Create and edit inventory categories");
        ResourceEntity userRead = resourceService.upsertSeed("USER_READ", "User list", "/api/users", "GET", "List users");
        ResourceEntity userWrite = resourceService.upsertSeed("USER_WRITE", "User write", "/api/users", "POST", "Create and edit users");
        ResourceEntity roleRead = resourceService.upsertSeed("ROLE_READ", "Role list", "/api/roles", "GET", "List roles");
        ResourceEntity roleWrite = resourceService.upsertSeed("ROLE_WRITE", "Role write", "/api/roles", "POST", "Create and edit roles");
        ResourceEntity resourceRead = resourceService.upsertSeed("RESOURCE_READ", "Resource list", "/api/resources", "GET", "List resources");
        ResourceEntity resourceWrite = resourceService.upsertSeed("RESOURCE_WRITE", "Resource write", "/api/resources", "POST", "Create and edit resources");

        Role admin = roleService.upsertSeed("ADMIN", "Administrator", "System administrator", List.of(
                authProfileRead, systemRead, inventoryRead, inventoryWrite, inventoryFinancialRead, itemSupplierRelationRead, itemSupplierRelationWrite, purchaseOrderRead, purchaseOrderWrite, salesOrderRead, salesOrderWrite, inventoryMovementRead, inventoryMovementWrite, supplierRead, supplierWrite, categoryRead, categoryWrite, userRead, userWrite, roleRead, roleWrite, resourceRead, resourceWrite
        ));
        Role operator = roleService.upsertSeed("OPERATOR", "Warehouse Operator", "Warehouse operations", List.of(
                authProfileRead, systemRead, inventoryRead, itemSupplierRelationRead, itemSupplierRelationWrite, purchaseOrderRead, purchaseOrderWrite, salesOrderRead, salesOrderWrite, inventoryMovementRead, inventoryMovementWrite, supplierRead, categoryRead
        ));

        categoryService.upsertSeed("HARDWARE", "Hardware", "Warehouse hardware devices");
        categoryService.upsertSeed("CONSUMABLE", "Consumables", "Warehouse consumable supplies");
        inventoryService.seedIfEmpty();
        supplierService.upsertSeed("SUP-001", "Acme Industrial Supply", "Alice Chen", "+64 9 555 0101", "alice@acme.example", "Auckland", "Primary hardware vendor");
        supplierService.upsertSeed("SUP-002", "Pacific Packing Co", "Ben Liu", "+64 9 555 0110", "sales@pacificpack.example", "Wellington", "Packaging materials supplier");

        if (securitySeedProperties.seedAdminUsername() != null && securitySeedProperties.seedAdminPassword() != null) {
            userService.upsertSeed(
                    securitySeedProperties.seedAdminUsername(),
                    securitySeedProperties.seedAdminPassword(),
                    "System Administrator",
                    List.of(admin)
            );
        }

        userService.upsertSeed("operator", "Operator@123456", "Warehouse Operator", List.of(operator));
    }
}
