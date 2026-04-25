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
        name = "stock_movement",
        indexes = {
                @Index(name = "idx_stock_movement_occurred_at", columnList = "occurred_at"),
                @Index(name = "idx_stock_movement_type", columnList = "type"),
                @Index(name = "idx_stock_movement_supplier_id", columnList = "supplier_id"),
                @Index(name = "idx_stock_movement_item_id", columnList = "inventory_item_id"),
                @Index(name = "idx_stock_movement_reference_no", columnList = "reference_no")
        }
)
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @ManyToOne
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private StockMovementType type;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Integer quantityDelta;

    @Column(precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(length = 120)
    private String referenceNo;

    @Column(length = 120)
    private String partnerName;

    @Column(length = 255)
    private String remark;

    @Column(nullable = false)
    private LocalDateTime occurredAt;

    /** Denormalized full-text search corpus. Set once at creation; movements are immutable. */
    @Column(name = "search_text", columnDefinition = "TEXT", nullable = false)
    private String searchText = "";

    protected StockMovement() {
    }

    public StockMovement(InventoryItem inventoryItem,
                         Supplier supplier,
                         StockMovementType type,
                         Integer quantity,
                         Integer quantityDelta,
                         BigDecimal unitPrice,
                         String referenceNo,
                         String partnerName,
                         String remark,
                         LocalDateTime occurredAt) {
        this.inventoryItem = inventoryItem;
        this.supplier = supplier;
        this.type = type;
        this.quantity = quantity;
        this.quantityDelta = quantityDelta;
        this.unitPrice = unitPrice;
        this.referenceNo = referenceNo;
        this.partnerName = partnerName;
        this.remark = remark;
        this.occurredAt = occurredAt;
    }

    public void setSearchText(String searchText) {
        this.searchText = searchText == null ? "" : searchText;
    }

    public Long getId() {
        return id;
    }

    public InventoryItem getInventoryItem() {
        return inventoryItem;
    }

    public StockMovementType getType() {
        return type;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public Integer getQuantityDelta() {
        return quantityDelta;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public String getReferenceNo() {
        return referenceNo;
    }

    public String getPartnerName() {
        return partnerName;
    }

    public String getRemark() {
        return remark;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }
}
