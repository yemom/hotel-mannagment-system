package com.hotelmanagement.repository;

import com.hotelmanagement.model.Reservation;
import com.hotelmanagement.model.ReservationStatus;
import com.hotelmanagement.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByGuestId(Long guestId);
    List<Reservation> findByRoomId(Long roomId);
    List<Reservation> findByStatus(ReservationStatus status);

    @Query("SELECT r FROM Reservation r WHERE r.room = :room " +
           "AND r.status != :status " +
           "AND r.checkOutDate > :checkIn " +
           "AND r.checkInDate < :checkOut")
    List<Reservation> findByRoomAndStatusNotAndCheckOutDateGreaterThanAndCheckInDateLessThan(
        @Param("room") Room room,
        @Param("status") ReservationStatus status,
        @Param("checkIn") LocalDate checkIn,
        @Param("checkOut") LocalDate checkOut
    );
}
