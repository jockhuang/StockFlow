package com.warehouse.backend.controller;

import com.warehouse.backend.service.RoleService;
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
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public PageResponse<RoleResponse> findPage(@RequestParam(defaultValue = "") String keyword,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size,
                                               @RequestParam(defaultValue = "id") String sortBy,
                                               @RequestParam(defaultValue = "desc") String sortDir) {
        return PageResponse.from(roleService.findPage(keyword, page, size, sortBy, sortDir), RoleResponse::from);
    }

    @GetMapping("/options")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public List<RoleResponse> findOptions() {
        return roleService.findAll().stream().map(RoleResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('ROLE_WRITE')")
    public RoleResponse create(@Valid @RequestBody RoleRequest request) {
        return RoleResponse.from(roleService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_WRITE')")
    public RoleResponse update(@PathVariable Long id, @Valid @RequestBody RoleRequest request) {
        return RoleResponse.from(roleService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('ROLE_WRITE')")
    public void delete(@PathVariable Long id) {
        roleService.delete(id);
    }
}
