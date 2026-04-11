package com.warehouse.backend.service;

import com.warehouse.backend.controller.RoleRequest;
import com.warehouse.backend.entity.ResourceEntity;
import com.warehouse.backend.entity.Role;
import com.warehouse.backend.entity.UserAccount;
import com.warehouse.backend.repository.RoleRepository;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.Hibernate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class RoleService {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "code", "name");

    private final RoleRepository roleRepository;
    private final ResourceService resourceService;

    public RoleService(RoleRepository roleRepository, ResourceService resourceService) {
        this.roleRepository = roleRepository;
        this.resourceService = resourceService;
    }

    @Transactional(readOnly = true)
    public Page<Role> findPage(String keyword, int page, int size, String sortBy, String sortDir) {
        String normalizedKeyword = SearchKeywordSupport.normalizeKeyword(keyword);
        Sort sort = SortSupport.resolveSort(sortBy, sortDir, "id", ALLOWED_SORT_FIELDS);
        Page<Role> roles;
        if (normalizedKeyword == null) {
            roles = roleRepository.findAll(PageRequest.of(page, size, sort));
        } else if (SearchKeywordSupport.isStructuredKeyword(normalizedKeyword)) {
            roles = roleRepository.searchByStructuredKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
        } else {
            roles = roleRepository.searchByTextKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
        }
        roles.forEach(role -> Hibernate.initialize(role.getResources()));
        return roles;
    }

    @Transactional(readOnly = true)
    public List<Role> findAll() {
        List<Role> roles = roleRepository.findAll(Sort.by("code").ascending());
        roles.forEach(role -> Hibernate.initialize(role.getResources()));
        return roles;
    }

    public Role create(RoleRequest request) {
        Role role = new Role(request.code(), request.name(), request.description());
        role.replaceResources(new LinkedHashSet<>(resourceService.findByIds(request.resourceIds())));
        Role saved = roleRepository.save(role);
        Hibernate.initialize(saved.getResources());
        return saved;
    }

    public Role update(Long id, RoleRequest request) {
        Role role = requireRole(id);
        role.update(request.code(), request.name(), request.description());
        role.replaceResources(new LinkedHashSet<>(resourceService.findByIds(request.resourceIds())));
        Hibernate.initialize(role.getResources());
        return role;
    }

    public void delete(Long id) {
        Role role = requireRole(id);
        for (UserAccount user : List.copyOf(role.getUsers())) {
            user.getRoles().remove(role);
        }
        roleRepository.delete(role);
    }

    public Role upsertSeed(String code, String name, String description, List<ResourceEntity> resources) {
        Role role = roleRepository.findByCode(code)
                .orElseGet(() -> new Role(code, name, description));
        role.update(code, name, description);
        role.replaceResources(new LinkedHashSet<>(resources));
        Role saved = roleRepository.save(role);
        Hibernate.initialize(saved.getResources());
        return saved;
    }

    public List<Role> findByIds(List<Long> ids) {
        return ids == null || ids.isEmpty() ? List.of() : roleRepository.findByIdIn(ids);
    }

    private Role requireRole(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + id));
    }

}
