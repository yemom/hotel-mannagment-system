package com.hotelmanagement.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "spa_bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "guest_id", nullable = false)
    private Guest guest;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "spa_service_id", nullable = false)
    private SpaService spaService;

    @Column(nullable = false)
    private LocalDate bookingDate;

    /**
     * Start time in "HH:mm" 24-hour format, e.g. "10:00", "14:30"
     */
    @Column(nullable = false)
    private String startTime;

    @Column(nullable = false)
    private Integer duration;

    @Column(nullable = false)
    private Integer numberOfGuests;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SpaBookingStatus status;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(length = 1000)
    private String specialRequests;

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
        if (status == null) {
            status = SpaBookingStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // State transition methods
    public boolean canConfirm() {
        return SpaBookingStatus.PENDING.equals(status);
    }

    public boolean canComplete() {
        return SpaBookingStatus.CONFIRMED.equals(status);
    }

    public boolean canCancel() {
        return SpaBookingStatus.PENDING.equals(status) || SpaBookingStatus.CONFIRMED.equals(status);
    }

    public void confirm() {
        if (!canConfirm()) {
            throw new IllegalStateException("Cannot confirm spa booking with status: " + status);
        }
        this.status = SpaBookingStatus.CONFIRMED;
    }

    public void complete() {
        if (!canComplete()) {
            throw new IllegalStateException("Cannot complete spa booking with status: " + status);
        }
        this.status = SpaBookingStatus.COMPLETED;
    }

    public void cancel() {
        if (!canCancel()) {
            throw new IllegalStateException("Cannot cancel spa booking with status: " + status);
        }
        this.status = SpaBookingStatus.CANCELLED;
    }

    // Validation methods
    public boolean isValidBookingDate() {
        return bookingDate != null && !bookingDate.isBefore(LocalDate.now());
    }

    public boolean isValidGuestCount() {
        return numberOfGuests != null && numberOfGuests >= 1 && numberOfGuests <= 20;
    }

    public boolean isValidStartTime() {
        return startTime != null && startTime.matches("^([01][0-9]|2[0-3]):[0-5][0-9]$");
    }
}
