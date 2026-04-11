package com.warehouse.backend.controller;

import com.warehouse.backend.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('RESOURCE_READ')")
    public PageResponse<ResourceResponse> findPage(@RequestParam(defaultValue = "") String keyword,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size,
                                                   @RequestParam(defaultValue = "id") String sortBy,
                                                   @RequestParam(defaultValue = "desc") String sortDir) {
        return PageResponse.from(resourceService.findPage(keyword, page, size, sortBy, sortDir), ResourceResponse::from);
    }

    @GetMapping("/options")
    @PreAuthorize("hasAuthority('RESOURCE_READ')")
    public List<ResourceResponse> findOptions() {
        return resourceService.findAll().stream().map(ResourceResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('RESOURCE_WRITE')")
    public ResourceResponse create(@Valid @RequestBody ResourceRequest request) {
        return ResourceResponse.from(resourceService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('RESOURCE_WRITE')")
    public ResourceResponse update(@PathVariable Long id, @Valid @RequestBody ResourceRequest request) {
        return ResourceResponse.from(resourceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('RESOURCE_WRITE')")
    public void delete(@PathVariable Long id) {
        resourceService.delete(id);
    }
}
