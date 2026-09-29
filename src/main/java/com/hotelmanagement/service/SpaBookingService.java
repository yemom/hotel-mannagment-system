package com.hotelmanagement.service;

import com.hotelmanagement.model.*;
import com.hotelmanagement.repository.GuestRepository;
import com.hotelmanagement.repository.SpaBookingRepository;
import com.hotelmanagement.repository.SpaServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SpaBookingService {

    private final SpaBookingRepository spaBookingRepository;
    private final SpaServiceRepository spaServiceRepository;
    private final GuestRepository guestRepository;

    public SpaBooking createBooking(SpaBooking booking) {
        if (booking == null) {
            throw new IllegalArgumentException("Booking cannot be null");
        }
        if (booking.getGuest() == null || booking.getGuest().getId() == null) {
            throw new IllegalArgumentException("Guest is required");
        }
        if (booking.getSpaService() == null || booking.getSpaService().getId() == null) {
            throw new IllegalArgumentException("Spa service is required");
        }
        if (booking.getBookingDate() == null) {
            throw new IllegalArgumentException("Booking date is required");
        }
        if (booking.getBookingDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot book spa treatment in the past");
        }
        if (booking.getStartTime() == null || booking.getStartTime().trim().isEmpty()) {
            throw new IllegalArgumentException("Start time is required");
        }
        if (!booking.getStartTime().matches("^([01][0-9]|2[0-3]):[0-5][0-9]$")) {
            throw new IllegalArgumentException("Start time must be in HH:mm format (e.g. 14:00)");
        }
        if (booking.getNumberOfGuests() == null || booking.getNumberOfGuests() < 1) {
            throw new IllegalArgumentException("Number of guests must be at least 1");
        }
        if (booking.getNumberOfGuests() > 20) {
            throw new IllegalArgumentException("Number of guests cannot exceed 20");
        }

        // Verify guest
        Guest guest = guestRepository.findById(booking.getGuest().getId())
                .orElseThrow(() -> new IllegalArgumentException("Guest not found with ID: " + booking.getGuest().getId()));

        if (guest.getStatus() != null && !GuestStatus.ACTIVE.equals(guest.getStatus())) {
            throw new IllegalArgumentException("Guest account is not active");
        }

        // Verify spa service
        SpaService service = spaServiceRepository.findById(booking.getSpaService().getId())
                .orElseThrow(() -> new IllegalArgumentException("Spa service not found with ID: " + booking.getSpaService().getId()));

        if (!Boolean.TRUE.equals(service.getActive())) {
            throw new IllegalArgumentException("Cannot book an inactive spa service");
        }

        if (booking.getNumberOfGuests() > service.getCapacity()) {
            throw new IllegalArgumentException("Number of guests (" + booking.getNumberOfGuests()
                    + ") exceeds maximum service capacity (" + service.getCapacity() + ")");
        }

        // Check time slot capacity conflicts
        List<SpaBooking> existingBookings = spaBookingRepository
                .findBySpaServiceAndBookingDateAndStartTimeAndStatusNot(
                        service,
                        booking.getBookingDate(),
                        booking.getStartTime(),
                        SpaBookingStatus.CANCELLED
                );

        int bookedGuests = existingBookings.stream()
                .mapToInt(SpaBooking::getNumberOfGuests)
                .sum();

        int availableCapacity = service.getCapacity() - bookedGuests;
        if (booking.getNumberOfGuests() > availableCapacity) {
            throw new IllegalStateException("Capacity conflict: This time slot only has "
                    + Math.max(0, availableCapacity) + " spot(s) remaining for " + service.getName());
        }

        // Calculate total price: unit price * number of guests
        BigDecimal pricePerPerson = service.getPrice();
        BigDecimal total = pricePerPerson.multiply(BigDecimal.valueOf(booking.getNumberOfGuests()));

        booking.setGuest(guest);
        booking.setSpaService(service);
        booking.setDuration(service.getDurationMinutes());
        booking.setTotalPrice(total);
        booking.setStatus(SpaBookingStatus.PENDING);
        booking.setCreatedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());

        return spaBookingRepository.save(booking);
    }

    public List<SpaBooking> getAllBookings() {
        return spaBookingRepository.findAll();
    }

    public Optional<SpaBooking> getBookingById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        return spaBookingRepository.findById(id);
    }

    public List<SpaBooking> getBookingsByGuest(Long guestId) {
        if (guestId == null) {
            throw new IllegalArgumentException("Guest ID cannot be null");
        }
        return spaBookingRepository.findByGuestId(guestId);
    }

    public List<SpaBooking> getBookingsByDate(LocalDate date) {
        if (date == null) {
            throw new IllegalArgumentException("Date cannot be null");
        }
        return spaBookingRepository.findByBookingDate(date);
    }

    public SpaBooking confirmBooking(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        SpaBooking booking = spaBookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Spa booking not found with ID: " + id));

        booking.confirm();
        booking.setUpdatedAt(LocalDateTime.now());
        return spaBookingRepository.save(booking);
    }

    public SpaBooking completeBooking(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        SpaBooking booking = spaBookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Spa booking not found with ID: " + id));

        booking.complete();
        booking.setUpdatedAt(LocalDateTime.now());
        return spaBookingRepository.save(booking);
    }

    public SpaBooking cancelBooking(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        SpaBooking booking = spaBookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Spa booking not found with ID: " + id));

        booking.cancel();
        booking.setUpdatedAt(LocalDateTime.now());
        return spaBookingRepository.save(booking);
    }
}
