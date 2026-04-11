package com.warehouse.backend.service;

import com.warehouse.backend.controller.InventoryRequest;
import com.warehouse.backend.entity.Category;
import com.warehouse.backend.entity.InventoryItem;
import com.warehouse.backend.entity.Supplier;
import com.warehouse.backend.repository.InventoryItemRepository;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.Hibernate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class InventoryService {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "sku", "name", "onHandQuantity", "location");

    private final InventoryItemRepository inventoryItemRepository;
    private final CategoryService categoryService;
    private final StockMovementService stockMovementService;
    private final SupplierService supplierService;

    public InventoryService(InventoryItemRepository inventoryItemRepository,
                            CategoryService categoryService,
                            StockMovementService stockMovementService,
                            SupplierService supplierService) {
        this.inventoryItemRepository = inventoryItemRepository;
        this.categoryService = categoryService;
        this.stockMovementService = stockMovementService;
        this.supplierService = supplierService;
    }

    @Transactional(readOnly = true)
    public Page<InventoryItem> findPage(String keyword, int page, int size, String sortBy, String sortDir) {
        String normalizedKeyword = SearchKeywordSupport.normalizeKeyword(keyword);
        Sort sort = SortSupport.resolveSort(sortBy, sortDir, "id", ALLOWED_SORT_FIELDS);
        Page<InventoryItem> items;
        if (normalizedKeyword == null) {
            items = inventoryItemRepository.findAll(PageRequest.of(page, size, sort));
        } else if (SearchKeywordSupport.isStructuredKeyword(normalizedKeyword)) {
            items = inventoryItemRepository.searchByStructuredKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
        } else {
            items = inventoryItemRepository.searchByTextKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
        }
        items.forEach(item -> Hibernate.initialize(item.getSuppliers()));
        return items;
    }

    public InventoryItem create(InventoryRequest request) {
        Category category = categoryService.requireCategory(request.categoryId());
        InventoryItem item = new InventoryItem(request.sku(), request.name(), request.quantity(), request.location(), category);
        syncSuppliers(item, resolveSuppliers(request.supplierIds()));
        InventoryItem saved = inventoryItemRepository.save(item);
        Hibernate.initialize(saved.getSuppliers());
        stockMovementService.createOpeningMovement(saved, request.quantity(), "Initial stock");
        return saved;
    }

    public InventoryItem update(Long id, InventoryRequest request) {
        InventoryItem item = requireInventoryItem(id);
        Category category = categoryService.requireCategory(request.categoryId());
        int previousQuantity = item.getQuantity();
        item.update(request.sku(), request.name(), request.quantity(), request.location(), category);
        syncSuppliers(item, resolveSuppliers(request.supplierIds()));
        stockMovementService.createAdjustmentMovement(item, request.quantity() - previousQuantity, "Manual stock correction from item edit");
        Hibernate.initialize(item.getSuppliers());
        return item;
    }

    public InventoryItem updateSupplierRelations(Long id, List<Long> supplierIds) {
        InventoryItem item = requireInventoryItem(id);
        syncSuppliers(item, resolveSuppliers(supplierIds));
        Hibernate.initialize(item.getSuppliers());
        return item;
    }

    public void delete(Long id) {
        InventoryItem item = requireInventoryItem(id);
        stockMovementService.deleteByInventoryItemId(item.getId());
        inventoryItemRepository.delete(item);
    }

    public void seedIfEmpty() {
        if (inventoryItemRepository.count() > 0) {
            return;
        }

        Category hardware = categoryService.upsertSeed("HARDWARE", "Hardware", "Warehouse hardware devices");
        Category consumables = categoryService.upsertSeed("CONSUMABLE", "Consumables", "Warehouse consumable supplies");

        create(new InventoryRequest("WH-1001", "Barcode Scanner", 18, "A-01", hardware.getId(), List.of()));
        create(new InventoryRequest("WH-1002", "Packing Tape", 260, "B-12", consumables.getId(), List.of()));
        create(new InventoryRequest("WH-1003", "Label Printer", 7, "C-03", hardware.getId(), List.of()));
    }

    public InventoryItem requireInventoryItem(Long id) {
        return inventoryItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Inventory item not found: " + id));
    }

    private Set<Supplier> resolveSuppliers(List<Long> supplierIds) {
        if (supplierIds == null || supplierIds.isEmpty()) {
            return new LinkedHashSet<>();
        }

        Set<Supplier> suppliers = new LinkedHashSet<>();
        for (Long supplierId : supplierIds) {
            suppliers.add(supplierService.requireSupplier(supplierId));
        }
        return suppliers;
    }

    private void syncSuppliers(InventoryItem item, Set<Supplier> targetSuppliers) {
        Set<Supplier> currentSuppliers = new LinkedHashSet<>(item.getSuppliers());
        for (Supplier currentSupplier : currentSuppliers) {
            currentSupplier.removeInventoryItem(item);
            item.removeSupplier(currentSupplier);
        }

        for (Supplier targetSupplier : targetSuppliers) {
            targetSupplier.addInventoryItem(item);
            item.addSupplier(targetSupplier);
        }
    }
}
