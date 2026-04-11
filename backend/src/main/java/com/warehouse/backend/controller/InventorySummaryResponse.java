package com.warehouse.backend.controller;

import java.math.BigDecimal;
import java.util.List;

public record InventorySummaryResponse(
        long totalItems,
        long totalStockQuantity,
        long totalOnHandQuantity,
        long totalInTransitQuantity,
        long totalCommittedQuantity,
        long totalAvailableQuantity,
        long lowStockItems,
        long totalPurchaseQuantity,
        long totalSaleQuantity,
        BigDecimal totalInventoryCost,
        BigDecimal totalSalesRevenue,
        BigDecimal totalSalesCost,
        BigDecimal totalSalesProfit,
        List<StockMovementResponse> recentMovements
) {
    public InventorySummaryResponse withoutFinancials() {
        return new InventorySummaryResponse(
                totalItems,
                totalStockQuantity,
                totalOnHandQuantity,
                totalInTransitQuantity,
                totalCommittedQuantity,
                totalAvailableQuantity,
                lowStockItems,
                totalPurchaseQuantity,
                totalSaleQuantity,
                null,
                null,
                null,
                null,
                recentMovements
        );
    }
}
