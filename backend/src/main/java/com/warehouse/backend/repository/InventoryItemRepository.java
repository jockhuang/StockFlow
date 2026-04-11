package com.warehouse.backend.repository;

import com.warehouse.backend.entity.InventoryItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    Optional<InventoryItem> findBySku(String sku);

    @Query("""
            select i from InventoryItem i
            where i.sku like concat(:keyword, '%')
               or i.location like concat(:keyword, '%')
               or i.category.code like concat(:keyword, '%')
            """)
    Page<InventoryItem> searchByStructuredKeyword(String keyword, Pageable pageable);

    @Query("""
            select i from InventoryItem i
            where lower(i.name) like lower(concat('%', :keyword, '%'))
               or lower(i.category.name) like lower(concat('%', :keyword, '%'))
            """)
    Page<InventoryItem> searchByTextKeyword(String keyword, Pageable pageable);

    @Query("select coalesce(sum(i.onHandQuantity), 0) from InventoryItem i")
    long sumOnHandQuantity();

    @Query("select coalesce(sum(i.inTransitQuantity), 0) from InventoryItem i")
    long sumInTransitQuantity();

    @Query("select coalesce(sum(i.committedQuantity), 0) from InventoryItem i")
    long sumCommittedQuantity();

    @Query("select count(i) from InventoryItem i where (i.onHandQuantity - i.committedQuantity) <= :threshold")
    long countLowStockItems(int threshold);

    @Query("select coalesce(sum(coalesce(i.averageUnitCost, 0) * i.onHandQuantity), 0) from InventoryItem i")
    BigDecimal sumInventoryCost();

    @Query("select coalesce(sum(coalesce(i.totalSalesRevenue, 0)), 0) from InventoryItem i")
    BigDecimal sumSalesRevenue();

    @Query("select coalesce(sum(coalesce(i.totalSalesCost, 0)), 0) from InventoryItem i")
    BigDecimal sumSalesCost();
}
