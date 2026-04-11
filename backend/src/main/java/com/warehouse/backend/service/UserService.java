package com.warehouse.backend.service;

import com.warehouse.backend.controller.UserRequest;
import com.warehouse.backend.entity.Role;
import com.warehouse.backend.entity.UserAccount;
import com.warehouse.backend.repository.UserAccountRepository;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.Hibernate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class UserService {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "username", "displayName", "enabled");

    private final UserAccountRepository userAccountRepository;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserAccountRepository userAccountRepository,
                       RoleService roleService,
                       PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.roleService = roleService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Page<UserAccount> findPage(String keyword, int page, int size, String sortBy, String sortDir) {
        String normalizedKeyword = SearchKeywordSupport.normalizeKeyword(keyword);
        Sort sort = SortSupport.resolveSort(sortBy, sortDir, "id", ALLOWED_SORT_FIELDS);
        Page<UserAccount> users;
        if (normalizedKeyword == null) {
            users = userAccountRepository.findAll(PageRequest.of(page, size, sort));
        } else if (SearchKeywordSupport.isStructuredKeyword(normalizedKeyword)) {
            users = userAccountRepository.searchByStructuredKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
        } else {
            users = userAccountRepository.searchByTextKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
        }
        users.forEach(user -> Hibernate.initialize(user.getRoles()));
        return users;
    }

    public UserAccount create(UserRequest request) {
        UserAccount user = new UserAccount(
                request.username(),
                passwordEncoder.encode(request.password()),
                request.displayName(),
                request.enabled()
        );
        user.replaceRoles(new LinkedHashSet<>(roleService.findByIds(request.roleIds())));
        UserAccount saved = userAccountRepository.save(user);
        Hibernate.initialize(saved.getRoles());
        return saved;
    }

    public UserAccount update(Long id, UserRequest request) {
        UserAccount user = requireUser(id);
        user.updateProfile(request.username(), request.displayName(), request.enabled());
        if (request.password() != null && !request.password().isBlank()) {
            user.updatePassword(passwordEncoder.encode(request.password()));
        }
        user.replaceRoles(new LinkedHashSet<>(roleService.findByIds(request.roleIds())));
        Hibernate.initialize(user.getRoles());
        return user;
    }

    public void delete(Long id) {
        userAccountRepository.delete(requireUser(id));
    }

    public UserAccount upsertSeed(String username, String rawPassword, String displayName, List<Role> roles) {
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseGet(() -> new UserAccount(username, passwordEncoder.encode(rawPassword), displayName, true));
        user.updateProfile(username, displayName, true);
        user.updatePassword(passwordEncoder.encode(rawPassword));
        user.replaceRoles(new LinkedHashSet<>(roles));
        UserAccount saved = userAccountRepository.save(user);
        Hibernate.initialize(saved.getRoles());
        return saved;
    }

    public UserAccount requireUser(Long id) {
        return userAccountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    }

}
