package com.warehouse.backend.controller;

import com.warehouse.backend.entity.StockMovement;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record StockMovementResponse(
        Long id,
        Long inventoryItemId,
        String inventorySku,
        String inventoryName,
        Long supplierId,
        String supplierCode,
        String supplierName,
        String type,
        Integer quantity,
        Integer quantityDelta,
        BigDecimal unitPrice,
        String referenceNo,
        String partnerName,
        String remark,
        LocalDateTime occurredAt
) {
    public static StockMovementResponse from(StockMovement movement) {
        return new StockMovementResponse(
                movement.getId(),
                movement.getInventoryItem().getId(),
                movement.getInventoryItem().getSku(),
                movement.getInventoryItem().getName(),
                movement.getSupplier() == null ? null : movement.getSupplier().getId(),
                movement.getSupplier() == null ? null : movement.getSupplier().getCode(),
                movement.getSupplier() == null ? null : movement.getSupplier().getName(),
                movement.getType().name(),
                movement.getQuantity(),
                movement.getQuantityDelta(),
                movement.getUnitPrice(),
                movement.getReferenceNo(),
                movement.getPartnerName(),
                movement.getRemark(),
                movement.getOccurredAt()
        );
    }
}
