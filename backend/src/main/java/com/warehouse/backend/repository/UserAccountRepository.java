package com.warehouse.backend.repository;

import com.warehouse.backend.entity.UserAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    Optional<UserAccount> findByUsername(String username);

    @Query("""
            select u from UserAccount u
            where u.username like concat(:keyword, '%')
            """)
    Page<UserAccount> searchByStructuredKeyword(String keyword, Pageable pageable);

    @Query("""
            select u from UserAccount u
            where lower(u.displayName) like lower(concat('%', :keyword, '%'))
            """)
    Page<UserAccount> searchByTextKeyword(String keyword, Pageable pageable);
}
