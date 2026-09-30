package com.hotelmanagement.repository;

import com.hotelmanagement.model.TableReservation;
import com.hotelmanagement.model.TableReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TableReservationRepository extends JpaRepository<TableReservation, Long> {
    List<TableReservation> findByGuestId(Long guestId);
    List<TableReservation> findByReservationDate(LocalDate date);
    List<TableReservation> findByStatus(TableReservationStatus status);
    List<TableReservation> findByRestaurantTableIdAndReservationDateAndTimeSlot(
        Long tableId, LocalDate date, String timeSlot);

    /**
     * Finds a conflicting booking for the same table/date/time slot, excluding one
     * reservation id (used when re-scheduling so a booking does not clash with itself).
     */
    List<TableReservation> findByRestaurantTableIdAndReservationDateAndTimeSlotAndStatusNotAndIdNot(
        Long tableId, LocalDate date, String timeSlot,
        TableReservationStatus status, Long excludeId);
}
