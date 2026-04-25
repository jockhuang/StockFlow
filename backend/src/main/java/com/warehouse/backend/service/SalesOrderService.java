package com.warehouse.backend.service;

import com.warehouse.backend.controller.SalesOrderRequest;
import com.warehouse.backend.entity.InventoryItem;
import com.warehouse.backend.entity.SalesOrder;
import com.warehouse.backend.entity.SalesOrderStatus;
import com.warehouse.backend.repository.SalesOrderRepository;
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
public class SalesOrderService {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "createdAt", "status", "quantity", "referenceNo");

    private final SalesOrderRepository salesOrderRepository;
    private final InventoryService inventoryService;
    private final StockMovementService stockMovementService;

    public SalesOrderService(SalesOrderRepository salesOrderRepository,
                             InventoryService inventoryService,
                             StockMovementService stockMovementService) {
        this.salesOrderRepository = salesOrderRepository;
        this.inventoryService = inventoryService;
        this.stockMovementService = stockMovementService;
    }

    @Transactional(readOnly = true)
    public Page<SalesOrder> findPage(String keyword, int page, int size, String sortBy, String sortDir) {
        String normalizedKeyword = SearchKeywordSupport.normalizeKeyword(keyword);
        Sort sort = SortSupport.resolveSort(sortBy, sortDir, "createdAt", ALLOWED_SORT_FIELDS);
        if (normalizedKeyword == null) {
            return salesOrderRepository.findAll(PageRequest.of(page, size, sort));
        }
        if (SearchKeywordSupport.isStructuredKeyword(normalizedKeyword)) {
            return salesOrderRepository.searchByStructuredKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
        }
        if (SearchKeywordSupport.needsShortKeywordFallback(normalizedKeyword)) {
            return salesOrderRepository.searchByShortTextKeyword(
                    normalizedKeyword.toLowerCase(), PageRequest.of(page, size));
        }
        return salesOrderRepository.searchByTextKeyword(
                SearchKeywordSupport.prepareFtsKeyword(normalizedKeyword), PageRequest.of(page, size));
    }

    public SalesOrder create(SalesOrderRequest request) {
        InventoryItem item = inventoryService.requireInventoryItem(request.inventoryItemId());
        if (item.getAvailableQuantity() < request.quantity()) {
            throw new IllegalArgumentException("Available stock is insufficient for this sales order.");
        }

        item.adjustCommittedQuantity(request.quantity());
        SalesOrder order = new SalesOrder(
                item,
                request.quantity(),
                request.unitPrice(),
                trimToNull(request.customerName()),
                trimToNull(request.referenceNo()),
                trimToNull(request.remark()),
                LocalDateTime.now()
        );
        order.setSearchText(SearchKeywordSupport.buildSearchText(item.getName(), trimToNull(request.customerName())));
        return salesOrderRepository.save(order);
    }

    public SalesOrder ship(Long id) {
        SalesOrder order = requireSalesOrder(id);
        if (order.getStatus() != SalesOrderStatus.CREATED) {
            throw new IllegalArgumentException("Sales order has already been shipped.");
        }

        InventoryItem item = order.getInventoryItem();
        if (item.getCommittedQuantity() < order.getQuantity()) {
            throw new IllegalArgumentException("Committed quantity is insufficient for shipment.");
        }
        if (item.getOnHandQuantity() < order.getQuantity()) {
            throw new IllegalArgumentException("On-hand quantity is insufficient for shipment.");
        }

        item.adjustCommittedQuantity(-order.getQuantity());
        item.applySalesShipment(order.getUnitPrice(), order.getQuantity());
        item.adjustOnHandQuantity(-order.getQuantity());
        order.markShipped(LocalDateTime.now());
        stockMovementService.recordSalesShipment(order);
        return order;
    }

    private SalesOrder requireSalesOrder(Long id) {
        return salesOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Sales order not found: " + id));
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
