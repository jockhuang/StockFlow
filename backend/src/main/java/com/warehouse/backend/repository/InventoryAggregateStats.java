package com.warehouse.backend.repository;

import java.math.BigDecimal;

/**
 * Spring Data JPA interface projection for aggregating all inventory summary
 * statistics in a single query. Used by {@link InventoryItemRepository#aggregateStats}.
 */
public interface InventoryAggregateStats {
    Long getTotalItems();
    Long getTotalOnHandQuantity();
    Long getTotalInTransitQuantity();
    Long getTotalCommittedQuantity();
    Long getLowStockItems();
    BigDecimal getTotalInventoryCost();
    BigDecimal getTotalSalesRevenue();
    BigDecimal getTotalSalesCost();
}
