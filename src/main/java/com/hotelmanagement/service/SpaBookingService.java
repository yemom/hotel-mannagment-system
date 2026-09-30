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

    /**
     * Re-schedules an existing spa booking owned by the acting guest.
     *
     * Server-side validation:
     *  - ownership (mismatch -> AccessDeniedException / 403)
     *  - only PENDING or CONFIRMED may change
     *  - date must not be in the past; time must match HH:mm
     *  - guest count within 1..20 and within the service capacity
     *  - slot capacity conflict check (excluding this booking)
     *  - status returns to PENDING so staff re-approve the change
     */
    public SpaBooking rescheduleBooking(Long id, LocalDate newDate, String newStartTime,
                                        Integer newGuests, Long actingGuestId) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        SpaBooking booking = spaBookingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Spa booking not found with ID: " + id));

        requireOwnership(booking.getGuest() != null ? booking.getGuest().getId() : null,
            actingGuestId);

        if (!SpaBookingStatus.PENDING.equals(booking.getStatus())
            && !SpaBookingStatus.CONFIRMED.equals(booking.getStatus())) {
            throw new IllegalStateException(
                "Cannot modify a booking with status: " + booking.getStatus());
        }

        if (newDate == null) {
            throw new IllegalArgumentException("Booking date is required");
        }
        if (newDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot book a spa treatment in the past");
        }
        if (newStartTime == null || !newStartTime.trim().matches("^([01][0-9]|2[0-3]):[0-5][0-9]$")) {
            throw new IllegalArgumentException("Start time must be in HH:mm format (e.g. 14:00)");
        }

        SpaService service = booking.getSpaService();
        if (service == null) {
            throw new IllegalArgumentException("Spa service is missing on this booking");
        }

        int guests = newGuests != null ? newGuests : booking.getNumberOfGuests();
        if (guests < 1 || guests > 20) {
            throw new IllegalArgumentException("Number of guests must be between 1 and 20");
        }
        if (service.getCapacity() != null && guests > service.getCapacity()) {
            throw new IllegalArgumentException("Number of guests (" + guests
                + ") exceeds maximum service capacity (" + service.getCapacity() + ")");
        }

        List<SpaBooking> existing = spaBookingRepository
            .findBySpaServiceAndBookingDateAndStartTimeAndStatusNot(
                service, newDate, newStartTime, SpaBookingStatus.CANCELLED);

        int bookedGuests = existing.stream()
            .filter(b -> !b.getId().equals(booking.getId()))
            .mapToInt(SpaBooking::getNumberOfGuests)
            .sum();

        int availableCapacity = service.getCapacity() - bookedGuests;
        if (guests > availableCapacity) {
            throw new IllegalStateException("Capacity conflict: This time slot only has "
                + Math.max(0, availableCapacity) + " spot(s) remaining for " + service.getName());
        }

        booking.setBookingDate(newDate);
        booking.setStartTime(newStartTime);
        booking.setNumberOfGuests(guests);
        booking.setDuration(service.getDurationMinutes());
        booking.setTotalPrice(service.getPrice().multiply(BigDecimal.valueOf(guests)));
        booking.setStatus(SpaBookingStatus.PENDING);
        booking.setUpdatedAt(LocalDateTime.now());

        return spaBookingRepository.save(booking);
    }

    /**
     * Cancels a booking on behalf of a specific guest, enforcing ownership.
     */
    public SpaBooking cancelBookingAs(Long id, Long actingGuestId) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        SpaBooking booking = spaBookingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Spa booking not found with ID: " + id));
        requireOwnership(booking.getGuest() != null ? booking.getGuest().getId() : null,
            actingGuestId);
        return cancelBooking(id);
    }

    /**
     * Admin queue: spa bookings still awaiting approval.
     */
    public List<SpaBooking> getPendingBookings() {
        return spaBookingRepository.findByStatus(SpaBookingStatus.PENDING);
    }

    private void requireOwnership(Long ownerGuestId, Long actingGuestId) {
        if (actingGuestId == null) {
            throw new IllegalArgumentException("actingGuestId is required");
        }
        if (ownerGuestId == null || !ownerGuestId.equals(actingGuestId)) {
            throw new com.hotelmanagement.exception.AccessDeniedException(
                "You may only modify your own reservations");
        }
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

    /**
     * Permanently removes a spa booking record.
     *
     * Used by the wellness desk when clearing cancelled or test appointments so the
     * appointment list only ever shows real, currently-tracked bookings.
     *
     * @throws IllegalArgumentException when no booking exists for the id
     */
    public void deleteBooking(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        if (!spaBookingRepository.existsById(id)) {
            throw new IllegalArgumentException("Spa booking not found with ID: " + id);
        }
        spaBookingRepository.deleteById(id);
    }
}
