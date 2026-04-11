package com.warehouse.backend.controller;

import com.warehouse.backend.service.SalesOrderService;
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
@RequestMapping("/api/sales-orders")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    public SalesOrderController(SalesOrderService salesOrderService) {
        this.salesOrderService = salesOrderService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SALES_ORDER_READ')")
    public PageResponse<SalesOrderResponse> findPage(@RequestParam(defaultValue = "") String keyword,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "10") int size,
                                                     @RequestParam(defaultValue = "createdAt") String sortBy,
                                                     @RequestParam(defaultValue = "desc") String sortDir) {
        return PageResponse.from(salesOrderService.findPage(keyword, page, size, sortBy, sortDir), SalesOrderResponse::from);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('SALES_ORDER_WRITE')")
    public SalesOrderResponse create(@Valid @RequestBody SalesOrderRequest request) {
        return SalesOrderResponse.from(salesOrderService.create(request));
    }

    @PostMapping("/{id}/ship")
    @PreAuthorize("hasAuthority('SALES_ORDER_WRITE')")
    public SalesOrderResponse ship(@PathVariable Long id) {
        return SalesOrderResponse.from(salesOrderService.ship(id));
    }
}
