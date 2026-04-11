package com.warehouse.backend.controller;

import java.util.List;

public record ItemSupplierRelationRequest(
        List<Long> supplierIds
) {
}
