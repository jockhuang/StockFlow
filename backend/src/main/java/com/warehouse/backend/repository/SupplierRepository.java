package com.warehouse.backend.repository;

import com.warehouse.backend.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    Optional<Supplier> findByCode(String code);

    @Query("""
            select s from Supplier s
            where s.code like concat(:keyword, '%')
               or coalesce(s.phone, '') like concat(:keyword, '%')
            """)
    Page<Supplier> searchByStructuredKeyword(String keyword, Pageable pageable);

    @Query("""
            select s from Supplier s
            where lower(s.name) like lower(concat('%', :keyword, '%'))
               or lower(coalesce(s.contactPerson, '')) like lower(concat('%', :keyword, '%'))
               or lower(coalesce(s.email, '')) like lower(concat('%', :keyword, '%'))
            """)
    Page<Supplier> searchByTextKeyword(String keyword, Pageable pageable);
}
