package com.hotelmanagement.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "reservations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "guest_id", nullable = false)
    private Guest guest;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false)
    private LocalDate checkInDate;

    @Column(nullable = false)
    private LocalDate checkOutDate;

    @Column(nullable = false)
    private Integer numberOfGuests;

    @Column(nullable = false)
    private BigDecimal totalPrice;

    @Column(nullable = false)
    private BigDecimal discountAmount;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ReservationStatus status; // PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED

    private String specialRequests;

    private LocalDate createdDate;

    private LocalDate modifiedDate;

    // State transition methods - for state transition testing
    public boolean canConfirm() {
        return ReservationStatus.PENDING.equals(status);
    }

    public boolean canCheckIn() {
        return ReservationStatus.CONFIRMED.equals(status) && isCheckInDateToday();
    }

    public boolean canCheckOut() {
        return ReservationStatus.CHECKED_IN.equals(status) && isCheckOutDateTodayOrEarlier();
    }

    public boolean canCancel() {
        return ReservationStatus.PENDING.equals(status) || ReservationStatus.CONFIRMED.equals(status);
    }

    private boolean isCheckInDateToday() {
        LocalDate today = LocalDate.now();
        return checkInDate.compareTo(today) <= 0;
    }

    private boolean isCheckOutDateTodayOrEarlier() {
        LocalDate today = LocalDate.now();
        return checkOutDate.compareTo(today) >= 0;
    }

    public void confirm() {
        if (canConfirm()) {
            this.status = ReservationStatus.CONFIRMED;
        } else {
            throw new IllegalStateException("Cannot confirm reservation with status: " + status);
        }
    }

    public void checkIn() {
        if (canCheckIn()) {
            this.status = ReservationStatus.CHECKED_IN;
        } else {
            throw new IllegalStateException("Cannot check in reservation with status: " + status);
        }
    }

    public void checkOut() {
        if (canCheckOut()) {
            this.status = ReservationStatus.CHECKED_OUT;
        } else {
            throw new IllegalStateException("Cannot check out reservation with status: " + status);
        }
    }

    public void cancel() {
        if (canCancel()) {
            this.status = ReservationStatus.CANCELLED;
        } else {
            throw new IllegalStateException("Cannot cancel reservation with status: " + status);
        }
    }

    // Validation
    public boolean isValidDateRange() {
        return checkInDate != null && checkOutDate != null && checkOutDate.isAfter(checkInDate);
    }

    public boolean isValidNumberOfGuests() {
        return numberOfGuests != null && numberOfGuests > 0 && numberOfGuests <= 20;
    }

    public long getNumberOfNights() {
        if (!isValidDateRange()) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(checkInDate, checkOutDate);
    }
}
