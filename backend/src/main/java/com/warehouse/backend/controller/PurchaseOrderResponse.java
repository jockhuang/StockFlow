package com.warehouse.backend.controller;

import com.warehouse.backend.entity.PurchaseOrder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PurchaseOrderResponse(
        Long id,
        Long inventoryItemId,
        String inventorySku,
        String inventoryName,
        Long supplierId,
        String supplierCode,
        String supplierName,
        Integer quantity,
        BigDecimal unitPrice,
        String referenceNo,
        String remark,
        String status,
        LocalDateTime createdAt,
        LocalDateTime receivedAt
) {
    public static PurchaseOrderResponse from(PurchaseOrder order) {
        return new PurchaseOrderResponse(
                order.getId(),
                order.getInventoryItem().getId(),
                order.getInventoryItem().getSku(),
                order.getInventoryItem().getName(),
                order.getSupplier().getId(),
                order.getSupplier().getCode(),
                order.getSupplier().getName(),
                order.getQuantity(),
                order.getUnitPrice(),
                order.getReferenceNo(),
                order.getRemark(),
                order.getStatus().name(),
                order.getCreatedAt(),
                order.getReceivedAt()
        );
    }
}
