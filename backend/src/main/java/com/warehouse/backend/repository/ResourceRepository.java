package com.warehouse.backend.repository;

import com.warehouse.backend.entity.ResourceEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ResourceRepository extends JpaRepository<ResourceEntity, Long> {

    Optional<ResourceEntity> findByCode(String code);

    List<ResourceEntity> findByIdIn(Collection<Long> ids);

    @Query("""
            select r from ResourceEntity r
            where r.code like concat(:keyword, '%')
               or r.path like concat(:keyword, '%')
            """)
    Page<ResourceEntity> searchByStructuredKeyword(String keyword, Pageable pageable);

    @Query("""
            select r from ResourceEntity r
            where lower(r.name) like lower(concat('%', :keyword, '%'))
            """)
    Page<ResourceEntity> searchByTextKeyword(String keyword, Pageable pageable);
}
