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

    @Query(value = """
            SELECT * FROM sales_order
            WHERE MATCH(search_text) AGAINST (:keyword IN BOOLEAN MODE)
            ORDER BY MATCH(search_text) AGAINST (:keyword IN BOOLEAN MODE) DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM sales_order
            WHERE MATCH(search_text) AGAINST (:keyword IN BOOLEAN MODE)
            """,
            nativeQuery = true)
    Page<SalesOrder> searchByTextKeyword(String keyword, Pageable pageable);

    @Query(value = """
            SELECT * FROM sales_order
            WHERE search_text LIKE CONCAT('%', :keyword, '%')
            ORDER BY id DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM sales_order
            WHERE search_text LIKE CONCAT('%', :keyword, '%')
            """,
            nativeQuery = true)
    Page<SalesOrder> searchByShortTextKeyword(String keyword, Pageable pageable);
}
