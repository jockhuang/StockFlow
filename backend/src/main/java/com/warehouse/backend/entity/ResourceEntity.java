package com.warehouse.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "sys_resource")
public class ResourceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 120)
    private String path;

    @Column(nullable = false, length = 16)
    private String httpMethod;

    @Column(length = 255)
    private String description;

    @ManyToMany(mappedBy = "resources", fetch = FetchType.LAZY)
    private Set<Role> roles = new LinkedHashSet<>();

    protected ResourceEntity() {
    }

    public ResourceEntity(String code, String name, String path, String httpMethod, String description) {
        this.code = code;
        this.name = name;
        this.path = path;
        this.httpMethod = httpMethod;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getPath() {
        return path;
    }

    public String getHttpMethod() {
        return httpMethod;
    }

    public String getDescription() {
        return description;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void update(String code, String name, String path, String httpMethod, String description) {
        this.code = code;
        this.name = name;
        this.path = path;
        this.httpMethod = httpMethod;
        this.description = description;
    }
}
