package com.warehouse.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "inventory_item")
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String sku;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false)
    private Integer onHandQuantity;

    @Column(nullable = false)
    private Integer inTransitQuantity;

    @Column(nullable = false)
    private Integer committedQuantity;

    @Column(precision = 18, scale = 4)
    private BigDecimal averageUnitCost;

    @Column(precision = 18, scale = 2)
    private BigDecimal totalSalesRevenue;

    @Column(precision = 18, scale = 2)
    private BigDecimal totalSalesCost;

    @Column(nullable = false, length = 80)
    private String location;

    @ManyToOne(optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @BatchSize(size = 50)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "inventory_item_supplier",
            joinColumns = @JoinColumn(name = "inventory_item_id"),
            inverseJoinColumns = @JoinColumn(name = "supplier_id")
    )
    private Set<Supplier> suppliers = new LinkedHashSet<>();

    protected InventoryItem() {
    }

    public InventoryItem(String sku, String name, Integer onHandQuantity, String location, Category category) {
        this.sku = sku;
        this.name = name;
        this.onHandQuantity = onHandQuantity;
        this.inTransitQuantity = 0;
        this.committedQuantity = 0;
        this.averageUnitCost = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
        this.totalSalesRevenue = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        this.totalSalesCost = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        this.location = location;
        this.category = category;
    }

    public Long getId() {
        return id;
    }

    public String getSku() {
        return sku;
    }

    public String getName() {
        return name;
    }

    public Integer getQuantity() {
        return onHandQuantity;
    }

    public Integer getOnHandQuantity() {
        return onHandQuantity;
    }

    public Integer getInTransitQuantity() {
        return inTransitQuantity;
    }

    public Integer getCommittedQuantity() {
        return committedQuantity;
    }

    public BigDecimal getAverageUnitCost() {
        return normalizedAverageUnitCost();
    }

    public BigDecimal getInventoryCost() {
        return normalizedAverageUnitCost().multiply(BigDecimal.valueOf(onHandQuantity)).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal getTotalSalesRevenue() {
        return normalizedRevenue();
    }

    public BigDecimal getTotalSalesCost() {
        return normalizedSalesCost();
    }

    public BigDecimal getTotalSalesProfit() {
        return normalizedRevenue().subtract(normalizedSalesCost()).setScale(2, RoundingMode.HALF_UP);
    }

    public Integer getAvailableQuantity() {
        return onHandQuantity - committedQuantity;
    }

    public String getLocation() {
        return location;
    }

    public Category getCategory() {
        return category;
    }

    public Set<Supplier> getSuppliers() {
        return suppliers;
    }

    public void adjustQuantity(Integer onHandQuantity) {
        this.onHandQuantity = onHandQuantity;
    }

    public void adjustOnHandQuantity(int delta) {
        this.onHandQuantity += delta;
    }

    public void adjustInTransitQuantity(int delta) {
        this.inTransitQuantity += delta;
    }

    public void adjustCommittedQuantity(int delta) {
        this.committedQuantity += delta;
    }

    public void applyPurchaseReceipt(BigDecimal unitCost, int quantity) {
        BigDecimal effectiveUnitCost = normalizeCurrency(unitCost).setScale(4, RoundingMode.HALF_UP);
        BigDecimal currentInventoryCost = normalizedAverageUnitCost().multiply(BigDecimal.valueOf(onHandQuantity));
        BigDecimal incomingInventoryCost = effectiveUnitCost.multiply(BigDecimal.valueOf(quantity));
        int nextOnHandQuantity = onHandQuantity + quantity;

        if (nextOnHandQuantity <= 0) {
            this.averageUnitCost = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
            return;
        }

        this.averageUnitCost = currentInventoryCost.add(incomingInventoryCost)
                .divide(BigDecimal.valueOf(nextOnHandQuantity), 4, RoundingMode.HALF_UP);
    }

    public void applySalesShipment(BigDecimal saleUnitPrice, int quantity) {
        BigDecimal revenue = normalizeCurrency(saleUnitPrice).multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal cost = normalizedAverageUnitCost().multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
        this.totalSalesRevenue = normalizedRevenue().add(revenue).setScale(2, RoundingMode.HALF_UP);
        this.totalSalesCost = normalizedSalesCost().add(cost).setScale(2, RoundingMode.HALF_UP);
    }

    public void update(String sku, String name, Integer onHandQuantity, String location, Category category) {
        this.sku = sku;
        this.name = name;
        this.onHandQuantity = onHandQuantity;
        this.location = location;
        this.category = category;
    }

    public void replaceSuppliers(Set<Supplier> suppliers) {
        this.suppliers.clear();
        this.suppliers.addAll(suppliers);
    }

    public void addSupplier(Supplier supplier) {
        this.suppliers.add(supplier);
    }

    public void removeSupplier(Supplier supplier) {
        this.suppliers.remove(supplier);
    }

    private BigDecimal normalizeCurrency(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizedAverageUnitCost() {
        return averageUnitCost == null ? BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP) : averageUnitCost.setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizedRevenue() {
        return totalSalesRevenue == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : totalSalesRevenue.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizedSalesCost() {
        return totalSalesCost == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : totalSalesCost.setScale(2, RoundingMode.HALF_UP);
    }
}
