package com.warehouse.backend.controller;

import com.warehouse.backend.entity.SalesOrder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SalesOrderResponse(
        Long id,
        Long inventoryItemId,
        String inventorySku,
        String inventoryName,
        Integer quantity,
        BigDecimal unitPrice,
        String customerName,
        String referenceNo,
        String remark,
        String status,
        LocalDateTime createdAt,
        LocalDateTime shippedAt
) {
    public static SalesOrderResponse from(SalesOrder order) {
        return new SalesOrderResponse(
                order.getId(),
                order.getInventoryItem().getId(),
                order.getInventoryItem().getSku(),
                order.getInventoryItem().getName(),
                order.getQuantity(),
                order.getUnitPrice(),
                order.getCustomerName(),
                order.getReferenceNo(),
                order.getRemark(),
                order.getStatus().name(),
                order.getCreatedAt(),
                order.getShippedAt()
        );
    }
}
