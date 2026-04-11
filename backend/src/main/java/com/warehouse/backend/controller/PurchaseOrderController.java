package com.warehouse.backend.controller;

import com.warehouse.backend.service.PurchaseOrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PURCHASE_ORDER_READ')")
    public PageResponse<PurchaseOrderResponse> findPage(@RequestParam(defaultValue = "") String keyword,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "10") int size,
                                                        @RequestParam(defaultValue = "createdAt") String sortBy,
                                                        @RequestParam(defaultValue = "desc") String sortDir) {
        return PageResponse.from(purchaseOrderService.findPage(keyword, page, size, sortBy, sortDir), PurchaseOrderResponse::from);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PURCHASE_ORDER_WRITE')")
    public PurchaseOrderResponse create(@Valid @RequestBody PurchaseOrderRequest request) {
        return PurchaseOrderResponse.from(purchaseOrderService.create(request));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAuthority('PURCHASE_ORDER_WRITE')")
    public PurchaseOrderResponse receive(@PathVariable Long id) {
        return PurchaseOrderResponse.from(purchaseOrderService.receive(id));
    }
}
