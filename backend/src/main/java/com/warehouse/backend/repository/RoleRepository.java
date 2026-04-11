package com.warehouse.backend.repository;

import com.warehouse.backend.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByCode(String code);

    List<Role> findByIdIn(Collection<Long> ids);

    @Query("""
            select r from Role r
            where r.code like concat(:keyword, '%')
            """)
    Page<Role> searchByStructuredKeyword(String keyword, Pageable pageable);

    @Query("""
            select r from Role r
            where lower(r.name) like lower(concat('%', :keyword, '%'))
            """)
    Page<Role> searchByTextKeyword(String keyword, Pageable pageable);
}
