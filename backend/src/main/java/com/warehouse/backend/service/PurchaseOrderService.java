package com.warehouse.backend.service;

import com.warehouse.backend.controller.PurchaseOrderRequest;
import com.warehouse.backend.entity.InventoryItem;
import com.warehouse.backend.entity.PurchaseOrder;
import com.warehouse.backend.entity.PurchaseOrderStatus;
import com.warehouse.backend.entity.Supplier;
import com.warehouse.backend.repository.PurchaseOrderRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@Transactional
public class PurchaseOrderService {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "createdAt", "status", "quantity", "referenceNo");

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InventoryService inventoryService;
    private final SupplierService supplierService;
    private final StockMovementService stockMovementService;

    public PurchaseOrderService(PurchaseOrderRepository purchaseOrderRepository,
                                InventoryService inventoryService,
                                SupplierService supplierService,
                                StockMovementService stockMovementService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.inventoryService = inventoryService;
        this.supplierService = supplierService;
        this.stockMovementService = stockMovementService;
    }

    @Transactional(readOnly = true)
    public Page<PurchaseOrder> findPage(String keyword, int page, int size, String sortBy, String sortDir) {
        String normalizedKeyword = SearchKeywordSupport.normalizeKeyword(keyword);
        Sort sort = SortSupport.resolveSort(sortBy, sortDir, "createdAt", ALLOWED_SORT_FIELDS);
        if (normalizedKeyword == null) {
            return purchaseOrderRepository.findAll(PageRequest.of(page, size, sort));
        }
        if (SearchKeywordSupport.isStructuredKeyword(normalizedKeyword)) {
            return purchaseOrderRepository.searchByStructuredKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
        }
        return purchaseOrderRepository.searchByTextKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
    }

    public PurchaseOrder create(PurchaseOrderRequest request) {
        InventoryItem item = inventoryService.requireInventoryItem(request.inventoryItemId());
        Supplier supplier = supplierService.requireSupplier(request.supplierId());
        if (!item.getSuppliers().contains(supplier)) {
            throw new IllegalArgumentException("Supplier is not linked to the selected inventory item.");
        }

        item.adjustInTransitQuantity(request.quantity());
        PurchaseOrder order = new PurchaseOrder(
                item,
                supplier,
                request.quantity(),
                request.unitPrice(),
                trimToNull(request.referenceNo()),
                trimToNull(request.remark()),
                LocalDateTime.now()
        );
        return purchaseOrderRepository.save(order);
    }

    public PurchaseOrder receive(Long id) {
        PurchaseOrder order = requirePurchaseOrder(id);
        if (order.getStatus() != PurchaseOrderStatus.CREATED) {
            throw new IllegalArgumentException("Purchase order has already been received.");
        }

        InventoryItem item = order.getInventoryItem();
        if (item.getInTransitQuantity() < order.getQuantity()) {
            throw new IllegalArgumentException("In-transit quantity is insufficient for receipt.");
        }

        item.adjustInTransitQuantity(-order.getQuantity());
        item.applyPurchaseReceipt(order.getUnitPrice(), order.getQuantity());
        item.adjustOnHandQuantity(order.getQuantity());
        order.markReceived(LocalDateTime.now());
        stockMovementService.recordPurchaseReceipt(order);
        return order;
    }

    private PurchaseOrder requirePurchaseOrder(Long id) {
        return purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Purchase order not found: " + id));
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
