package com.warehouse.backend.repository;

import com.warehouse.backend.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByCode(String code);

    @Query("""
            select c from Category c
            where c.code like concat(:keyword, '%')
            """)
    Page<Category> searchByStructuredKeyword(String keyword, Pageable pageable);

    @Query("""
            select c from Category c
            where lower(c.name) like lower(concat('%', :keyword, '%'))
            """)
    Page<Category> searchByTextKeyword(String keyword, Pageable pageable);
}
