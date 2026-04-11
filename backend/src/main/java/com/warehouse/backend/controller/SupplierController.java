package com.warehouse.backend.controller;

import com.warehouse.backend.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SUPPLIER_READ')")
    public PageResponse<SupplierResponse> findPage(@RequestParam(defaultValue = "") String keyword,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size,
                                                   @RequestParam(defaultValue = "id") String sortBy,
                                                   @RequestParam(defaultValue = "desc") String sortDir) {
        return PageResponse.from(supplierService.findPage(keyword, page, size, sortBy, sortDir), SupplierResponse::from);
    }

    @GetMapping("/options")
    @PreAuthorize("hasAuthority('SUPPLIER_READ')")
    public List<SupplierResponse> findOptions() {
        return supplierService.findAll().stream().map(SupplierResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('SUPPLIER_WRITE')")
    public SupplierResponse create(@Valid @RequestBody SupplierRequest request) {
        return SupplierResponse.from(supplierService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPPLIER_WRITE')")
    public SupplierResponse update(@PathVariable Long id, @Valid @RequestBody SupplierRequest request) {
        return SupplierResponse.from(supplierService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('SUPPLIER_WRITE')")
    public void delete(@PathVariable Long id) {
        supplierService.delete(id);
    }
}
