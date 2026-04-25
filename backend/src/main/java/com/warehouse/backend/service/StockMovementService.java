package com.warehouse.backend.service;

import com.warehouse.backend.controller.InventorySummaryResponse;
import com.warehouse.backend.controller.StockMovementRequest;
import com.warehouse.backend.controller.StockMovementResponse;
import com.warehouse.backend.entity.InventoryItem;
import com.warehouse.backend.entity.PurchaseOrder;
import com.warehouse.backend.entity.SalesOrder;
import com.warehouse.backend.entity.StockMovement;
import com.warehouse.backend.entity.StockMovementType;
import com.warehouse.backend.entity.Supplier;
import com.warehouse.backend.repository.InventoryAggregateStats;
import com.warehouse.backend.repository.InventoryItemRepository;
import com.warehouse.backend.repository.StockMovementRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
public class StockMovementService {

    private static final int LOW_STOCK_THRESHOLD = 10;
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "occurredAt", "type", "quantity", "referenceNo");

    private final StockMovementRepository stockMovementRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final SupplierService supplierService;

    public StockMovementService(StockMovementRepository stockMovementRepository,
                                InventoryItemRepository inventoryItemRepository,
                                SupplierService supplierService) {
        this.stockMovementRepository = stockMovementRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.supplierService = supplierService;
    }

    @Transactional(readOnly = true)
    public Page<StockMovement> findPage(String keyword, StockMovementType type, Long supplierId, int page, int size, String sortBy, String sortDir) {
        String normalizedKeyword = SearchKeywordSupport.normalizeKeyword(keyword);
        Sort sort = SortSupport.resolveSort(sortBy, sortDir, "occurredAt", ALLOWED_SORT_FIELDS);
        String typeStr = type == null ? null : type.name();
        if (normalizedKeyword == null) {
            return stockMovementRepository.findPageByFilters(type, supplierId, PageRequest.of(page, size, sort));
        }
        if (SearchKeywordSupport.isStructuredKeyword(normalizedKeyword)) {
            return stockMovementRepository.searchByStructuredKeyword(normalizedKeyword, type, supplierId, PageRequest.of(page, size, sort));
        }
        if (SearchKeywordSupport.needsShortKeywordFallback(normalizedKeyword)) {
            return stockMovementRepository.searchByShortTextKeyword(
                    normalizedKeyword.toLowerCase(), typeStr, supplierId, PageRequest.of(page, size));
        }
        return stockMovementRepository.searchByTextKeyword(
                SearchKeywordSupport.prepareFtsKeyword(normalizedKeyword), typeStr, supplierId, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public InventorySummaryResponse summary() {
        // Query 1: all inventory-item aggregates in one shot (replaces 7 individual queries)
        InventoryAggregateStats stats = inventoryItemRepository.aggregateStats(LOW_STOCK_THRESHOLD);

        // Query 2: purchase + sale totals in one GROUP BY query (replaces 2 individual queries)
        Map<StockMovementType, Long> qtyByType = new EnumMap<>(StockMovementType.class);
        for (Object[] row : stockMovementRepository.sumQuantitiesByTypes(
                List.of(StockMovementType.PURCHASE, StockMovementType.SALE))) {
            qtyByType.put((StockMovementType) row[0], ((Number) row[1]).longValue());
        }
        long totalPurchaseQuantity = qtyByType.getOrDefault(StockMovementType.PURCHASE, 0L);
        long totalSaleQuantity = qtyByType.getOrDefault(StockMovementType.SALE, 0L);

        // Query 3: recent movements (unchanged)
        List<StockMovement> recentMovements = stockMovementRepository.findTop10ByOrderByOccurredAtDescIdDesc();

        long totalOnHandQuantity = stats.getTotalOnHandQuantity();
        BigDecimal totalSalesRevenue = defaultMoney(stats.getTotalSalesRevenue());
        BigDecimal totalSalesCost = defaultMoney(stats.getTotalSalesCost());
        BigDecimal totalSalesProfit = totalSalesRevenue.subtract(totalSalesCost).setScale(2, RoundingMode.HALF_UP);

        return new InventorySummaryResponse(
                stats.getTotalItems(),
                totalOnHandQuantity,
                totalOnHandQuantity,
                stats.getTotalInTransitQuantity(),
                stats.getTotalCommittedQuantity(),
                totalOnHandQuantity - stats.getTotalCommittedQuantity(),
                stats.getLowStockItems(),
                totalPurchaseQuantity,
                totalSaleQuantity,
                defaultMoney(stats.getTotalInventoryCost()),
                totalSalesRevenue,
                totalSalesCost,
                totalSalesProfit,
                recentMovements.stream().map(StockMovementResponse::from).toList()
        );
    }

    public StockMovement record(StockMovementRequest request) {
        if (request.type() == StockMovementType.OPENING) {
            throw new IllegalArgumentException("Opening stock can only be created by the system.");
        }
        if (request.type() == StockMovementType.PURCHASE || request.type() == StockMovementType.SALE) {
            throw new IllegalArgumentException("Purchase and sale movements must be processed through purchase orders or sales orders.");
        }

        InventoryItem item = requireInventoryItem(request.inventoryItemId());
        Supplier supplier = request.supplierId() == null ? null : supplierService.requireSupplier(request.supplierId());
        int quantityDelta = quantityDelta(request.type(), request.quantity());
        int nextQuantity = item.getQuantity() + quantityDelta;
        if (nextQuantity < 0) {
            throw new IllegalArgumentException("Insufficient stock for outbound transaction.");
        }

        item.adjustQuantity(nextQuantity);
        StockMovement movement = new StockMovement(
                item,
                supplier,
                request.type(),
                request.quantity(),
                quantityDelta,
                request.unitPrice(),
                trimToNull(request.referenceNo()),
                trimToNull(request.partnerName()),
                trimToNull(request.remark()),
                request.occurredAt() == null ? LocalDateTime.now() : request.occurredAt()
        );
        movement.setSearchText(SearchKeywordSupport.buildSearchText(
                item.getName(),
                supplier != null ? supplier.getName() : null,
                trimToNull(request.partnerName()),
                trimToNull(request.remark())
        ));
        return stockMovementRepository.save(movement);
    }

    public void createOpeningMovement(InventoryItem item, int quantity, String remark) {
        if (quantity <= 0) {
            return;
        }

        StockMovement m = new StockMovement(
                item, null, StockMovementType.OPENING,
                quantity, quantity, BigDecimal.ZERO,
                "OPENING", null, remark, LocalDateTime.now()
        );
        m.setSearchText(SearchKeywordSupport.buildSearchText(item.getName(), remark));
        stockMovementRepository.save(m);
    }

    public void createAdjustmentMovement(InventoryItem item, int quantityDelta, String remark) {
        if (quantityDelta == 0) {
            return;
        }

        StockMovementType type = quantityDelta > 0 ? StockMovementType.ADJUSTMENT_IN : StockMovementType.ADJUSTMENT_OUT;
        StockMovement m = new StockMovement(
                item, null, type,
                Math.abs(quantityDelta), quantityDelta, null,
                "MANUAL-EDIT", null, remark, LocalDateTime.now()
        );
        m.setSearchText(SearchKeywordSupport.buildSearchText(item.getName(), remark));
        stockMovementRepository.save(m);
    }

    public void recordPurchaseReceipt(PurchaseOrder order) {
        StockMovement m = new StockMovement(
                order.getInventoryItem(), order.getSupplier(), StockMovementType.PURCHASE,
                order.getQuantity(), order.getQuantity(), order.getUnitPrice(),
                order.getReferenceNo(), order.getSupplier().getName(),
                order.getRemark(), order.getReceivedAt()
        );
        m.setSearchText(SearchKeywordSupport.buildSearchText(
                order.getInventoryItem().getName(),
                order.getSupplier().getName(),
                order.getRemark()
        ));
        stockMovementRepository.save(m);
    }

    public void recordSalesShipment(SalesOrder order) {
        StockMovement m = new StockMovement(
                order.getInventoryItem(), null, StockMovementType.SALE,
                order.getQuantity(), -order.getQuantity(), order.getUnitPrice(),
                order.getReferenceNo(), order.getCustomerName(),
                order.getRemark(), order.getShippedAt()
        );
        m.setSearchText(SearchKeywordSupport.buildSearchText(
                order.getInventoryItem().getName(),
                order.getCustomerName(),
                order.getRemark()
        ));
        stockMovementRepository.save(m);
    }

    public void deleteByInventoryItemId(Long inventoryItemId) {
        stockMovementRepository.deleteByInventoryItemId(inventoryItemId);
    }

    private InventoryItem requireInventoryItem(Long id) {
        return inventoryItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Inventory item not found: " + id));
    }

    private int quantityDelta(StockMovementType type, int quantity) {
        return switch (type) {
            case OPENING, PURCHASE, ADJUSTMENT_IN -> quantity;
            case SALE, ADJUSTMENT_OUT -> -quantity;
        };
    }

    private String normalizeKeyword(String keyword) {
        return keyword == null || keyword.isBlank() ? null : keyword.trim();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private BigDecimal defaultMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }
}
