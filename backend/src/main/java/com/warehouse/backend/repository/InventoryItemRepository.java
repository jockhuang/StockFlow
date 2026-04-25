package com.warehouse.backend.repository;

import com.warehouse.backend.entity.InventoryItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    Optional<InventoryItem> findBySku(String sku);

    boolean existsByIdAndSuppliersId(Long itemId, Long supplierId);

    @Query("""
            select i from InventoryItem i
            where i.sku like concat(:keyword, '%')
               or i.location like concat(:keyword, '%')
               or i.category.code like concat(:keyword, '%')
            """)
    Page<InventoryItem> searchByStructuredKeyword(String keyword, Pageable pageable);

    /**
     * FULLTEXT word-prefix search on the denormalized search_text column.
     * Keyword must be pre-formatted as BOOLEAN MODE syntax, e.g. {@code "+bar* +scan*"}.
     * Use for keywords where every word is >= {@code SearchKeywordSupport.FTS_MIN_WORD_LENGTH} chars.
     */
    @Query(value = """
            SELECT * FROM inventory_item
            WHERE MATCH(search_text) AGAINST (:keyword IN BOOLEAN MODE)
            ORDER BY MATCH(search_text) AGAINST (:keyword IN BOOLEAN MODE) DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM inventory_item
            WHERE MATCH(search_text) AGAINST (:keyword IN BOOLEAN MODE)
            """,
            nativeQuery = true)
    Page<InventoryItem> searchByTextKeyword(String keyword, Pageable pageable);

    /**
     * LIKE fallback for short keywords (< {@code FTS_MIN_WORD_LENGTH} chars)
     * that MySQL FULLTEXT would silently ignore.
     */
    @Query(value = """
            SELECT * FROM inventory_item
            WHERE search_text LIKE CONCAT('%', :keyword, '%')
            ORDER BY id DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM inventory_item
            WHERE search_text LIKE CONCAT('%', :keyword, '%')
            """,
            nativeQuery = true)
    Page<InventoryItem> searchByShortTextKeyword(String keyword, Pageable pageable);

    /**
     * Aggregates all inventory summary statistics in a single DB round-trip.
     * Replaces the seven individual sum/count queries previously fired by summary().
     */
    @Query("""
            select
                count(i)                                                                               as totalItems,
                coalesce(sum(i.onHandQuantity), 0)                                                     as totalOnHandQuantity,
                coalesce(sum(i.inTransitQuantity), 0)                                                  as totalInTransitQuantity,
                coalesce(sum(i.committedQuantity), 0)                                                  as totalCommittedQuantity,
                coalesce(sum(case when (i.onHandQuantity - i.committedQuantity) <= :threshold then 1 else 0 end), 0)
                                                                                                       as lowStockItems,
                coalesce(sum(coalesce(i.averageUnitCost, 0) * i.onHandQuantity), 0)                   as totalInventoryCost,
                coalesce(sum(coalesce(i.totalSalesRevenue, 0)), 0)                                     as totalSalesRevenue,
                coalesce(sum(coalesce(i.totalSalesCost, 0)), 0)                                        as totalSalesCost
            from InventoryItem i
            """)
    InventoryAggregateStats aggregateStats(int threshold);
}
