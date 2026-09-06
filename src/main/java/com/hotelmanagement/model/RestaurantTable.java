package com.hotelmanagement.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Entity
@Table(name = "restaurant_tables")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String tableNumber;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DiningArea area;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TableStatus status;

    private String description;

    // Helper
    public boolean isAvailableForBooking() {
        return TableStatus.AVAILABLE.equals(status);
    }
}
