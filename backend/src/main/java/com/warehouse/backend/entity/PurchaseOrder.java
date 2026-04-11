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
        name = "purchase_order",
        indexes = {
                @Index(name = "idx_purchase_order_created_at", columnList = "created_at"),
                @Index(name = "idx_purchase_order_supplier_id", columnList = "supplier_id"),
                @Index(name = "idx_purchase_order_item_id", columnList = "inventory_item_id"),
                @Index(name = "idx_purchase_order_reference_no", columnList = "reference_no")
        }
)
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @ManyToOne(optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(nullable = false)
    private Integer quantity;

    @Column(precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(length = 120)
    private String referenceNo;

    @Column(length = 255)
    private String remark;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PurchaseOrderStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime receivedAt;

    protected PurchaseOrder() {
    }

    public PurchaseOrder(InventoryItem inventoryItem,
                         Supplier supplier,
                         Integer quantity,
                         BigDecimal unitPrice,
                         String referenceNo,
                         String remark,
                         LocalDateTime createdAt) {
        this.inventoryItem = inventoryItem;
        this.supplier = supplier;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.referenceNo = referenceNo;
        this.remark = remark;
        this.status = PurchaseOrderStatus.CREATED;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public InventoryItem getInventoryItem() { return inventoryItem; }
    public Supplier getSupplier() { return supplier; }
    public Integer getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public String getReferenceNo() { return referenceNo; }
    public String getRemark() { return remark; }
    public PurchaseOrderStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getReceivedAt() { return receivedAt; }

    public void markReceived(LocalDateTime receivedAt) {
        this.status = PurchaseOrderStatus.RECEIVED;
        this.receivedAt = receivedAt;
    }
}
