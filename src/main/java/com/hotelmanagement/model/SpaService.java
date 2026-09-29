package com.hotelmanagement.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "spa_services")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SpaCategory category;

    @Column(nullable = false)
    private Integer durationMinutes;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(length = 1000)
    private String imageUrl;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (active == null) {
            active = true;
        }
        if (capacity == null) {
            capacity = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Domain validation methods
    public boolean isValidPrice() {
        return price != null
                && price.compareTo(BigDecimal.ZERO) > 0
                && price.compareTo(new BigDecimal("5000.00")) <= 0;
    }

    public boolean isValidDuration() {
        return durationMinutes != null
                && durationMinutes >= 15
                && durationMinutes <= 480;
    }

    public boolean isValidCapacity() {
        return capacity != null
                && capacity >= 1
                && capacity <= 20;
    }

    public boolean isAvailable() {
        return Boolean.TRUE.equals(active);
    }
}
