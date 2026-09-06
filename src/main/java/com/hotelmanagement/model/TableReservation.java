package com.hotelmanagement.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "table_reservations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "guest_id", nullable = false)
    private Guest guest;

    // Nullable — table may be auto-assigned by staff
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "table_id")
    private RestaurantTable restaurantTable;

    @Column(nullable = false)
    private LocalDate reservationDate;

    /** Time slot as "HH:mm" string, e.g. "18:00", "18:30" */
    @Column(nullable = false)
    private String timeSlot;

    @Column(nullable = false)
    private Integer partySize;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TableReservationStatus status;

    private String specialRequests;

    private LocalDateTime createdAt;

    // State transitions
    public boolean canConfirm()  { return TableReservationStatus.PENDING.equals(status); }
    public boolean canSeat()     { return TableReservationStatus.CONFIRMED.equals(status); }
    public boolean canComplete() { return TableReservationStatus.SEATED.equals(status); }
    public boolean canCancel()   {
        return TableReservationStatus.PENDING.equals(status) ||
               TableReservationStatus.CONFIRMED.equals(status);
    }
    public boolean canMarkNoShow() {
        return TableReservationStatus.CONFIRMED.equals(status) ||
               TableReservationStatus.PENDING.equals(status);
    }

    public void confirm()    { if (canConfirm())    status = TableReservationStatus.CONFIRMED;  else throw new IllegalStateException("Cannot confirm"); }
    public void seat()       { if (canSeat())       status = TableReservationStatus.SEATED;     else throw new IllegalStateException("Cannot seat"); }
    public void complete()   { if (canComplete())   status = TableReservationStatus.COMPLETED;  else throw new IllegalStateException("Cannot complete"); }
    public void cancel()     { if (canCancel())     status = TableReservationStatus.CANCELLED;  else throw new IllegalStateException("Cannot cancel"); }
    public void markNoShow() { if (canMarkNoShow()) status = TableReservationStatus.NO_SHOW;    else throw new IllegalStateException("Cannot mark no-show"); }
}
