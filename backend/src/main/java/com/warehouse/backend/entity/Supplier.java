package com.warehouse.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.BatchSize;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "inventory_supplier")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 120)
    private String contactPerson;

    @Column(length = 40)
    private String phone;

    @Column(length = 120)
    private String email;

    @Column(length = 255)
    private String address;

    @Column(length = 255)
    private String description;

    @BatchSize(size = 50)
    @ManyToMany(mappedBy = "suppliers", fetch = FetchType.LAZY)
    private Set<InventoryItem> inventoryItems = new LinkedHashSet<>();

    protected Supplier() {
    }

    public Supplier(String code,
                    String name,
                    String contactPerson,
                    String phone,
                    String email,
                    String address,
                    String description) {
        this.code = code;
        this.name = name;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.email = email;
        this.address = address;
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

    public String getContactPerson() {
        return contactPerson;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getAddress() {
        return address;
    }

    public String getDescription() {
        return description;
    }

    public Set<InventoryItem> getInventoryItems() {
        return inventoryItems;
    }

    public void update(String code,
                       String name,
                       String contactPerson,
                       String phone,
                       String email,
                       String address,
                       String description) {
        this.code = code;
        this.name = name;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.description = description;
    }

    public void replaceInventoryItems(Set<InventoryItem> inventoryItems) {
        this.inventoryItems.clear();
        this.inventoryItems.addAll(inventoryItems);
    }

    public void addInventoryItem(InventoryItem inventoryItem) {
        this.inventoryItems.add(inventoryItem);
    }

    public void removeInventoryItem(InventoryItem inventoryItem) {
        this.inventoryItems.remove(inventoryItem);
    }
}
