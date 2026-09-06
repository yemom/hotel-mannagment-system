package com.hotelmanagement.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Entity
@Table(name = "guests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Guest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // In production, use BCrypt

    @Column(nullable = false)
    private String phone;

    private Integer age; // For testing age ranges

    @Column(nullable = false)
    private GuestStatus status; // ACTIVE, SUSPENDED, INACTIVE

    private String address;

    private String city;

    private String country;

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public boolean isValidAge() {
        return age != null && age >= 18 && age <= 120;
    }

    public boolean canMakeReservation() {
        return GuestStatus.ACTIVE.equals(status) && isValidAge();
    }
}
