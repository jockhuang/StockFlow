package com.warehouse.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "sales_order",
        indexes = {
                @Index(name = "idx_sales_order_created_at", columnList = "created_at"),
                @Index(name = "idx_sales_order_item_id", columnList = "inventory_item_id"),
                @Index(name = "idx_sales_order_reference_no", columnList = "reference_no")
        }
)
public class SalesOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(nullable = false)
    private Integer quantity;

    @Column(precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(length = 120)
    private String customerName;

    @Column(length = 120)
    private String referenceNo;

    @Column(length = 255)
    private String remark;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SalesOrderStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime shippedAt;

    /** Denormalized full-text search corpus (item name + customer name). Set once at creation. */
    @Column(name = "search_text", columnDefinition = "TEXT", nullable = false)
    private String searchText = "";

    protected SalesOrder() {
    }

    public SalesOrder(InventoryItem inventoryItem,
                      Integer quantity,
                      BigDecimal unitPrice,
                      String customerName,
                      String referenceNo,
                      String remark,
                      LocalDateTime createdAt) {
        this.inventoryItem = inventoryItem;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.customerName = customerName;
        this.referenceNo = referenceNo;
        this.remark = remark;
        this.status = SalesOrderStatus.CREATED;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public InventoryItem getInventoryItem() { return inventoryItem; }
    public Integer getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public String getCustomerName() { return customerName; }
    public String getReferenceNo() { return referenceNo; }
    public String getRemark() { return remark; }
    public SalesOrderStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getShippedAt() { return shippedAt; }

    public void setSearchText(String searchText) {
        this.searchText = searchText == null ? "" : searchText;
    }

    public void markShipped(LocalDateTime shippedAt) {
        this.status = SalesOrderStatus.SHIPPED;
        this.shippedAt = shippedAt;
    }
}
