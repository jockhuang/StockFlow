package com.warehouse.backend.controller;

import com.warehouse.backend.entity.StockMovementType;
import com.warehouse.backend.service.InventoryService;
import com.warehouse.backend.service.StockMovementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory-items")
public class InventoryController {

    private final InventoryService inventoryService;
    private final StockMovementService stockMovementService;

    public InventoryController(InventoryService inventoryService, StockMovementService stockMovementService) {
        this.inventoryService = inventoryService;
        this.stockMovementService = stockMovementService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('INVENTORY_READ')")
    public PageResponse<InventoryResponse> findPage(@RequestParam(defaultValue = "") String keyword,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size,
                                                    @RequestParam(defaultValue = "id") String sortBy,
                                                    @RequestParam(defaultValue = "desc") String sortDir,
                                                    Authentication authentication) {
        boolean includeFinancials = hasFinancialRead(authentication);
        return PageResponse.from(inventoryService.findPage(keyword, page, size, sortBy, sortDir), item -> InventoryResponse.from(item, includeFinancials));
    }

    @GetMapping("/supplier-relations")
    @PreAuthorize("hasAuthority('ITEM_SUPPLIER_RELATION_READ')")
    public PageResponse<InventoryResponse> supplierRelationPage(@RequestParam(defaultValue = "") String keyword,
                                                                @RequestParam(defaultValue = "0") int page,
                                                                @RequestParam(defaultValue = "10") int size,
                                                                @RequestParam(defaultValue = "id") String sortBy,
                                                                @RequestParam(defaultValue = "desc") String sortDir,
                                                                Authentication authentication) {
        boolean includeFinancials = hasFinancialRead(authentication);
        return PageResponse.from(inventoryService.findPage(keyword, page, size, sortBy, sortDir), item -> InventoryResponse.from(item, includeFinancials));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('INVENTORY_READ', 'INVENTORY_MOVEMENT_READ')")
    public InventorySummaryResponse summary(Authentication authentication) {
        InventorySummaryResponse summary = stockMovementService.summary();
        return hasFinancialRead(authentication) ? summary : summary.withoutFinancials();
    }

    @GetMapping("/movements")
    @PreAuthorize("hasAnyAuthority('INVENTORY_READ', 'INVENTORY_MOVEMENT_READ')")
    public PageResponse<StockMovementResponse> movementPage(@RequestParam(defaultValue = "") String keyword,
                                                            @RequestParam(required = false) StockMovementType type,
                                                            @RequestParam(required = false) Long supplierId,
                                                            @RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "10") int size,
                                                            @RequestParam(defaultValue = "occurredAt") String sortBy,
                                                            @RequestParam(defaultValue = "desc") String sortDir) {
        return PageResponse.from(stockMovementService.findPage(keyword, type, supplierId, page, size, sortBy, sortDir), StockMovementResponse::from);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('INVENTORY_WRITE')")
    public InventoryResponse create(@Valid @RequestBody InventoryRequest request, Authentication authentication) {
        return InventoryResponse.from(inventoryService.create(request), hasFinancialRead(authentication));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('INVENTORY_WRITE')")
    public InventoryResponse update(@PathVariable Long id, @Valid @RequestBody InventoryRequest request, Authentication authentication) {
        return InventoryResponse.from(inventoryService.update(id, request), hasFinancialRead(authentication));
    }

    @PutMapping("/{id}/supplier-relations")
    @PreAuthorize("hasAuthority('ITEM_SUPPLIER_RELATION_WRITE')")
    public InventoryResponse updateSupplierRelations(@PathVariable Long id, @RequestBody ItemSupplierRelationRequest request, Authentication authentication) {
        return InventoryResponse.from(inventoryService.updateSupplierRelations(id, request.supplierIds()), hasFinancialRead(authentication));
    }

    @PostMapping("/movements")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyAuthority('INVENTORY_WRITE', 'INVENTORY_MOVEMENT_WRITE')")
    public StockMovementResponse recordMovement(@Valid @RequestBody StockMovementRequest request) {
        return StockMovementResponse.from(stockMovementService.record(request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('INVENTORY_WRITE')")
    public void delete(@PathVariable Long id) {
        inventoryService.delete(id);
    }

    private boolean hasFinancialRead(Authentication authentication) {
        if (authentication == null) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "INVENTORY_FINANCIAL_READ".equals(authority.getAuthority()));
    }
}
