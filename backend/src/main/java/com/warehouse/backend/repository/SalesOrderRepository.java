package com.warehouse.backend.repository;

import com.warehouse.backend.entity.SalesOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    @Query("""
            select s from SalesOrder s
            where s.inventoryItem.sku like concat(:keyword, '%')
               or coalesce(s.referenceNo, '') like concat(:keyword, '%')
            """)
    Page<SalesOrder> searchByStructuredKeyword(String keyword, Pageable pageable);

    @Query("""
            select s from SalesOrder s
            where lower(s.inventoryItem.name) like lower(concat('%', :keyword, '%'))
               or lower(coalesce(s.customerName, '')) like lower(concat('%', :keyword, '%'))
            """)
    Page<SalesOrder> searchByTextKeyword(String keyword, Pageable pageable);
}
