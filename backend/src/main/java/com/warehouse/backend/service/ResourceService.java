package com.warehouse.backend.service;

import com.warehouse.backend.controller.ResourceRequest;
import com.warehouse.backend.entity.ResourceEntity;
import com.warehouse.backend.entity.Role;
import com.warehouse.backend.repository.ResourceRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@Transactional
public class ResourceService {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "code", "name", "httpMethod", "path");

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @Transactional(readOnly = true)
    public Page<ResourceEntity> findPage(String keyword, int page, int size, String sortBy, String sortDir) {
        String normalizedKeyword = SearchKeywordSupport.normalizeKeyword(keyword);
        Sort sort = SortSupport.resolveSort(sortBy, sortDir, "id", ALLOWED_SORT_FIELDS);
        if (normalizedKeyword == null) {
            return resourceRepository.findAll(PageRequest.of(page, size, sort));
        }
        if (SearchKeywordSupport.isStructuredKeyword(normalizedKeyword)) {
            return resourceRepository.searchByStructuredKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
        }
        return resourceRepository.searchByTextKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
    }

    @Transactional(readOnly = true)
    public List<ResourceEntity> findAll() {
        return resourceRepository.findAll(Sort.by("code").ascending());
    }

    public ResourceEntity create(ResourceRequest request) {
        return resourceRepository.save(new ResourceEntity(
                request.code(),
                request.name(),
                request.path(),
                request.httpMethod(),
                request.description()
        ));
    }

    public ResourceEntity update(Long id, ResourceRequest request) {
        ResourceEntity resource = requireResource(id);
        resource.update(request.code(), request.name(), request.path(), request.httpMethod(), request.description());
        return resource;
    }

    public void delete(Long id) {
        ResourceEntity resource = requireResource(id);
        for (Role role : List.copyOf(resource.getRoles())) {
            role.getResources().remove(resource);
        }
        resourceRepository.delete(resource);
    }

    public ResourceEntity upsertSeed(String code, String name, String path, String httpMethod, String description) {
        return resourceRepository.findByCode(code)
                .map(existing -> {
                    existing.update(code, name, path, httpMethod, description);
                    return existing;
                })
                .orElseGet(() -> resourceRepository.save(new ResourceEntity(code, name, path, httpMethod, description)));
    }

    public List<ResourceEntity> findByIds(List<Long> ids) {
        return ids == null || ids.isEmpty() ? List.of() : resourceRepository.findByIdIn(ids);
    }

    private ResourceEntity requireResource(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Resource not found: " + id));
    }

}
