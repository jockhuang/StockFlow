package com.warehouse.backend.service;

import com.warehouse.backend.controller.CategoryRequest;
import com.warehouse.backend.entity.Category;
import com.warehouse.backend.repository.CategoryRepository;
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
public class CategoryService {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "code", "name");

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public Page<Category> findPage(String keyword, int page, int size, String sortBy, String sortDir) {
        String normalizedKeyword = SearchKeywordSupport.normalizeKeyword(keyword);
        Sort sort = SortSupport.resolveSort(sortBy, sortDir, "id", ALLOWED_SORT_FIELDS);
        if (normalizedKeyword == null) {
            return categoryRepository.findAll(PageRequest.of(page, size, sort));
        }
        if (SearchKeywordSupport.isStructuredKeyword(normalizedKeyword)) {
            return categoryRepository.searchByStructuredKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
        }
        return categoryRepository.searchByTextKeyword(normalizedKeyword, PageRequest.of(page, size, sort));
    }

    @Transactional(readOnly = true)
    public List<Category> findAll() {
        return categoryRepository.findAll(Sort.by("code").ascending());
    }

    public Category create(CategoryRequest request) {
        return categoryRepository.save(new Category(request.code(), request.name(), request.description()));
    }

    public Category update(Long id, CategoryRequest request) {
        Category category = requireCategory(id);
        category.update(request.code(), request.name(), request.description());
        return category;
    }

    public void delete(Long id) {
        categoryRepository.delete(requireCategory(id));
    }

    public Category requireCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + id));
    }

    public Category upsertSeed(String code, String name, String description) {
        return categoryRepository.findByCode(code)
                .map(existing -> {
                    existing.update(code, name, description);
                    return existing;
                })
                .orElseGet(() -> categoryRepository.save(new Category(code, name, description)));
    }

}
