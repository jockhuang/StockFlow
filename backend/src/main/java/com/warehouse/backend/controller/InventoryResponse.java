package com.warehouse.backend.controller;

import com.warehouse.backend.entity.InventoryItem;
import com.warehouse.backend.entity.Supplier;

import java.math.BigDecimal;
import java.util.List;

public record InventoryResponse(
        Long id,
        String sku,
        String name,
        Integer quantity,
        Integer onHandQuantity,
        Integer inTransitQuantity,
        Integer committedQuantity,
        Integer availableQuantity,
        BigDecimal averageUnitCost,
        BigDecimal inventoryCost,
        BigDecimal totalSalesRevenue,
        BigDecimal totalSalesCost,
        BigDecimal totalSalesProfit,
        String location,
        Long categoryId,
        String categoryCode,
        String categoryName,
        List<Long> supplierIds,
        List<String> supplierNames
) {
    public static InventoryResponse from(InventoryItem item) {
        return from(item, true);
    }

    public static InventoryResponse from(InventoryItem item, boolean includeFinancials) {
        return new InventoryResponse(
                item.getId(),
                item.getSku(),
                item.getName(),
                item.getQuantity(),
                item.getOnHandQuantity(),
                item.getInTransitQuantity(),
                item.getCommittedQuantity(),
                item.getAvailableQuantity(),
                includeFinancials ? item.getAverageUnitCost() : null,
                includeFinancials ? item.getInventoryCost() : null,
                includeFinancials ? item.getTotalSalesRevenue() : null,
                includeFinancials ? item.getTotalSalesCost() : null,
                includeFinancials ? item.getTotalSalesProfit() : null,
                item.getLocation(),
                item.getCategory().getId(),
                item.getCategory().getCode(),
                item.getCategory().getName(),
                item.getSuppliers().stream().map(Supplier::getId).sorted().toList(),
                item.getSuppliers().stream().map(Supplier::getName).sorted().toList()
        );
    }
}
