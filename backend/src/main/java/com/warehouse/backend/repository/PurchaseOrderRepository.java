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

    @Query(value = """
            SELECT * FROM purchase_order
            WHERE MATCH(search_text) AGAINST (:keyword IN BOOLEAN MODE)
            ORDER BY MATCH(search_text) AGAINST (:keyword IN BOOLEAN MODE) DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM purchase_order
            WHERE MATCH(search_text) AGAINST (:keyword IN BOOLEAN MODE)
            """,
            nativeQuery = true)
    Page<PurchaseOrder> searchByTextKeyword(String keyword, Pageable pageable);

    @Query(value = """
            SELECT * FROM purchase_order
            WHERE search_text LIKE CONCAT('%', :keyword, '%')
            ORDER BY id DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM purchase_order
            WHERE search_text LIKE CONCAT('%', :keyword, '%')
            """,
            nativeQuery = true)
    Page<PurchaseOrder> searchByShortTextKeyword(String keyword, Pageable pageable);
}
