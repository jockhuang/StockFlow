package com.warehouse.backend.repository;

import com.warehouse.backend.entity.StockMovement;
import com.warehouse.backend.entity.StockMovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    @Query("""
            select m from StockMovement m
            left join m.supplier supplier
            where (:type is null or m.type = :type)
              and (:supplierId is null or supplier.id = :supplierId)
            """)
    Page<StockMovement> findPageByFilters(StockMovementType type, Long supplierId, Pageable pageable);

    @Query("""
            select m from StockMovement m
            left join m.supplier supplier
            where (:type is null or m.type = :type)
              and (:supplierId is null or supplier.id = :supplierId)
              and (
                   m.inventoryItem.sku like concat(:keyword, '%')
                   or coalesce(m.referenceNo, '') like concat(:keyword, '%')
                   or coalesce(supplier.code, '') like concat(:keyword, '%')
              )
            """)
    Page<StockMovement> searchByStructuredKeyword(String keyword, StockMovementType type, Long supplierId, Pageable pageable);

    /**
     * FULLTEXT word-prefix search. Keyword must be pre-formatted as BOOLEAN MODE syntax.
     * {@code type} and {@code typeStr} carry the same value (null check and enum comparison
     * are split because native SQL cannot compare a null parameter to an enum column directly).
     */
    @Query(value = """
            SELECT * FROM stock_movement m
            WHERE (:typeStr IS NULL OR m.type = :typeStr)
              AND (:supplierId IS NULL OR m.supplier_id = :supplierId)
              AND MATCH(m.search_text) AGAINST (:keyword IN BOOLEAN MODE)
            ORDER BY MATCH(m.search_text) AGAINST (:keyword IN BOOLEAN MODE) DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM stock_movement m
            WHERE (:typeStr IS NULL OR m.type = :typeStr)
              AND (:supplierId IS NULL OR m.supplier_id = :supplierId)
              AND MATCH(m.search_text) AGAINST (:keyword IN BOOLEAN MODE)
            """,
            nativeQuery = true)
    Page<StockMovement> searchByTextKeyword(String keyword,
                                            @Param("typeStr") String typeStr,
                                            @Param("supplierId") Long supplierId,
                                            Pageable pageable);

    /** LIKE fallback for short keywords — same filters, no FULLTEXT. */
    @Query(value = """
            SELECT * FROM stock_movement m
            WHERE (:typeStr IS NULL OR m.type = :typeStr)
              AND (:supplierId IS NULL OR m.supplier_id = :supplierId)
              AND m.search_text LIKE CONCAT('%', :keyword, '%')
            ORDER BY m.id DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM stock_movement m
            WHERE (:typeStr IS NULL OR m.type = :typeStr)
              AND (:supplierId IS NULL OR m.supplier_id = :supplierId)
              AND m.search_text LIKE CONCAT('%', :keyword, '%')
            """,
            nativeQuery = true)
    Page<StockMovement> searchByShortTextKeyword(String keyword,
                                                 @Param("typeStr") String typeStr,
                                                 @Param("supplierId") Long supplierId,
                                                 Pageable pageable);

    List<StockMovement> findTop10ByOrderByOccurredAtDescIdDesc();

    void deleteByInventoryItemId(Long inventoryItemId);

    /**
     * Returns one row per requested type: [StockMovementType, Long totalQuantity].
     * Replaces the two individual sumQuantityByType calls in summary() with a single GROUP BY query.
     */
    @Query("""
            select m.type, coalesce(sum(m.quantity), 0)
            from StockMovement m
            where m.type in :types
            group by m.type
            """)
    List<Object[]> sumQuantitiesByTypes(Collection<StockMovementType> types);
}
