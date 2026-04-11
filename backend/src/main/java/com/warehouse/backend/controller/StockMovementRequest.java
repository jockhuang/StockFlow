package com.warehouse.backend.controller;

import com.warehouse.backend.entity.StockMovementType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record StockMovementRequest(
        @NotNull Long inventoryItemId,
        Long supplierId,
        @NotNull StockMovementType type,
        @NotNull @Min(1) Integer quantity,
        @DecimalMin("0.00") BigDecimal unitPrice,
        @Size(max = 120) String referenceNo,
        @Size(max = 120) String partnerName,
        @Size(max = 255) String remark,
        LocalDateTime occurredAt
) {
}
