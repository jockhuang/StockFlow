package com.warehouse.backend.repository;

import com.warehouse.backend.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    @Query("""
            select p from PurchaseOrder p
            where p.inventoryItem.sku like concat(:keyword, '%')
               or coalesce(p.referenceNo, '') like concat(:keyword, '%')
               or p.supplier.code like concat(:keyword, '%')
            """)
    Page<PurchaseOrder> searchByStructuredKeyword(String keyword, Pageable pageable);

    @Query("""
            select p from PurchaseOrder p
            where lower(p.inventoryItem.name) like lower(concat('%', :keyword, '%'))
               or lower(p.supplier.name) like lower(concat('%', :keyword, '%'))
            """)
    Page<PurchaseOrder> searchByTextKeyword(String keyword, Pageable pageable);
}
