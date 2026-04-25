package com.warehouse.backend.service;

import com.warehouse.backend.controller.SupplierRequest;
import com.warehouse.backend.entity.InventoryItem;
import com.warehouse.backend.entity.Supplier;
import com.warehouse.backend.repository.InventoryItemRepository;
import com.warehouse.backend.repository.SupplierRepository;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.Hibernate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class SupplierService {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "code", "name", "contactPerson", "phone");

    private final SupplierRepository supplierRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public SupplierService(SupplierRepository supplierRepository,
                           InventoryItemRepository inventoryItemRepository) {
        this.supplierRepository = supplierRepository;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    @Transactional(readOnly = true)
    public Page<Supplier> findPage(String keyword, int page, int size, String sortBy, String sortDir) {
        String normalizedKeyword = SearchKeywordSupport.normalizeKeyword(keyword);
        Sort sort = SortSupport.resolveSort(sortBy, sortDir, "id", ALLOWED_SORT_FIELDS);
        Page<Supplier> suppliers;
        if (normalizedKeyword == null) {
            suppliers = supplierRepository.findAll(PageRequest.of(page, size, sort));
        } else if (SearchKeywordSupport.isStructuredKeyword(normalizedKeyword)) {
            suppliers = supplierRepository.searchByStructuredKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
        } else {
            suppliers = supplierRepository.searchByTextKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
        }
        suppliers.forEach(supplier -> Hibernate.initialize(supplier.getInventoryItems()));
        return suppliers;
    }

    @Transactional(readOnly = true)
    public List<Supplier> findAll() {
        List<Supplier> suppliers = supplierRepository.findAll(Sort.by("code").ascending());
        suppliers.forEach(supplier -> Hibernate.initialize(supplier.getInventoryItems()));
        return suppliers;
    }

    public Supplier create(SupplierRequest request) {
        Supplier supplier = new Supplier(
                request.code(),
                request.name(),
                request.contactPerson(),
                request.phone(),
                request.email(),
                request.address(),
                request.description()
        );
        Supplier saved = supplierRepository.save(supplier);
        syncInventoryItems(saved, resolveItems(request.inventoryItemIds()));
        Hibernate.initialize(saved.getInventoryItems());
        return saved;
    }

    public Supplier update(Long id, SupplierRequest request) {
        Supplier supplier = requireSupplier(id);
        supplier.update(
                request.code(),
                request.name(),
                request.contactPerson(),
                request.phone(),
                request.email(),
                request.address(),
                request.description()
        );
        syncInventoryItems(supplier, resolveItems(request.inventoryItemIds()));
        Hibernate.initialize(supplier.getInventoryItems());
        return supplier;
    }

    public void delete(Long id) {
        Supplier supplier = requireSupplier(id);
        syncInventoryItems(supplier, new LinkedHashSet<>());
        supplierRepository.delete(supplier);
    }

    public Supplier requireSupplier(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Supplier not found: " + id));
    }

    /** Batch-load suppliers by ID — single WHERE id IN (...) query. */
    public List<Supplier> findAllById(List<Long> ids) {
        return supplierRepository.findAllById(ids);
    }

    public Supplier upsertSeed(String code,
                               String name,
                               String contactPerson,
                               String phone,
                               String email,
                               String address,
                               String description) {
        return supplierRepository.findByCode(code)
                .map(existing -> {
                    existing.update(code, name, contactPerson, phone, email, address, description);
                    return existing;
                })
                .orElseGet(() -> supplierRepository.save(new Supplier(code, name, contactPerson, phone, email, address, description)));
    }

    private Set<InventoryItem> resolveItems(List<Long> inventoryItemIds) {
        if (inventoryItemIds == null || inventoryItemIds.isEmpty()) {
            return new LinkedHashSet<>();
        }

        return new LinkedHashSet<>(inventoryItemRepository.findAllById(inventoryItemIds));
    }

    private void syncInventoryItems(Supplier supplier, Set<InventoryItem> targetItems) {
        Set<InventoryItem> currentItems = new LinkedHashSet<>(supplier.getInventoryItems());
        for (InventoryItem currentItem : currentItems) {
            currentItem.removeSupplier(supplier);
            supplier.removeInventoryItem(currentItem);
        }

        for (InventoryItem targetItem : targetItems) {
            targetItem.addSupplier(supplier);
            supplier.addInventoryItem(targetItem);
        }
    }
}
