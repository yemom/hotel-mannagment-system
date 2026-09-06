package com.hotelmanagement.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String roomNumber;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RoomType roomType;

    @Column(nullable = false)
    private BigDecimal basePrice; // Price ranges for equivalence partitioning

    @Column(nullable = false)
    private Integer capacity; // Guest capacity

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RoomStatus status; // AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED

    private String description;

    private Boolean hasBathtub;
    private Boolean hasBalcony;
    private Boolean hasMinibar;

    // Validation rules
    public boolean isAvailableForBooking() {
        return RoomStatus.AVAILABLE.equals(status) || RoomStatus.RESERVED.equals(status);
    }

    public boolean isOccupied() {
        return RoomStatus.OCCUPIED.equals(status);
    }

    public boolean canAccommodate(Integer guests) {
        return guests != null && guests > 0 && guests <= capacity;
    }

    public boolean isPriceInValidRange() {
        return basePrice != null && basePrice.compareTo(BigDecimal.ZERO) > 0 
            && basePrice.compareTo(new BigDecimal("10000")) <= 0; // Price range validation
    }
}
