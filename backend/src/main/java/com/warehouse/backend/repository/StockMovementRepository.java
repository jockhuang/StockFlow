package com.warehouse.backend.repository;

import com.warehouse.backend.entity.StockMovement;
import com.warehouse.backend.entity.StockMovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
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

    @Query("""
            select m from StockMovement m
            left join m.supplier supplier
            where (:type is null or m.type = :type)
              and (:supplierId is null or supplier.id = :supplierId)
              and (
                   lower(m.inventoryItem.name) like lower(concat('%', :keyword, '%'))
                   or lower(coalesce(m.partnerName, '')) like lower(concat('%', :keyword, '%'))
                   or lower(coalesce(m.remark, '')) like lower(concat('%', :keyword, '%'))
                   or lower(coalesce(supplier.name, '')) like lower(concat('%', :keyword, '%'))
              )
            """)
    Page<StockMovement> searchByTextKeyword(String keyword, StockMovementType type, Long supplierId, Pageable pageable);

    List<StockMovement> findTop10ByOrderByOccurredAtDescIdDesc();

    void deleteByInventoryItemId(Long inventoryItemId);

    @Query("select coalesce(sum(m.quantity), 0) from StockMovement m where m.type = :type")
    long sumQuantityByType(StockMovementType type);
}
