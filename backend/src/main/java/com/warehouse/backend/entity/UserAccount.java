package com.warehouse.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.BatchSize;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "sys_user")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, length = 120)
    private String displayName;

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(nullable = false)
    private Boolean accountNonLocked = true;

    @BatchSize(size = 50)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "sys_user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new LinkedHashSet<>();

    protected UserAccount() {
    }

    public UserAccount(String username, String password, String displayName, Boolean enabled) {
        this.username = username;
        this.password = password;
        this.displayName = displayName;
        this.enabled = enabled;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public String getDisplayName() {
        return displayName;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public Boolean getAccountNonLocked() {
        return accountNonLocked;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void updateProfile(String username, String displayName, Boolean enabled) {
        this.username = username;
        this.displayName = displayName;
        this.enabled = enabled;
    }

    public void updatePassword(String password) {
        this.password = password;
    }

    public void replaceRoles(Set<Role> roles) {
        this.roles.clear();
        this.roles.addAll(roles);
    }
}
