package com.hotelmanagement.repository;

import com.hotelmanagement.model.SpaBooking;
import com.hotelmanagement.model.SpaBookingStatus;
import com.hotelmanagement.model.SpaService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SpaBookingRepository extends JpaRepository<SpaBooking, Long> {

    List<SpaBooking> findByGuestId(Long guestId);

    List<SpaBooking> findBySpaServiceId(Long spaServiceId);

    List<SpaBooking> findByBookingDate(LocalDate bookingDate);

    List<SpaBooking> findByStatus(SpaBookingStatus status);

    List<SpaBooking> findBySpaServiceAndBookingDateAndStatusNot(
            SpaService spaService,
            LocalDate bookingDate,
            SpaBookingStatus status
    );

    List<SpaBooking> findBySpaServiceAndBookingDateAndStartTimeAndStatusNot(
            SpaService spaService,
            LocalDate bookingDate,
            String startTime,
            SpaBookingStatus status
    );
}
