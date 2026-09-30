package com.hotelmanagement.service;

import com.hotelmanagement.model.Reservation;
import com.hotelmanagement.model.ReservationStatus;
import com.hotelmanagement.model.Room;
import com.hotelmanagement.repository.ReservationRepository;
import com.hotelmanagement.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final PricingService pricingService;

    /**
     * Creates a new reservation with discount calculation.
     * Used for testing conditional logic and decision tables.
     */
    public Reservation createReservation(Reservation reservation) {
        // Validate
        if (!reservation.isValidDateRange()) {
            throw new IllegalArgumentException("Invalid date range");
        }
        if (!reservation.isValidNumberOfGuests()) {
            throw new IllegalArgumentException("Invalid number of guests");
        }
        if (!reservation.getRoom().canAccommodate(reservation.getNumberOfGuests())) {
            throw new IllegalArgumentException("Room cannot accommodate the number of guests");
        }

        // Check room availability
        if (!isRoomAvailable(reservation.getRoom(), reservation.getCheckInDate(), 
            reservation.getCheckOutDate())) {
            throw new IllegalArgumentException("Room is not available for the requested dates");
        }

        // Calculate price and discount
        BigDecimal baseTotal = calculateBaseTotal(reservation);
        BigDecimal discount = calculateDiscount(reservation);
        BigDecimal finalPrice = baseTotal.subtract(discount);

        reservation.setTotalPrice(finalPrice);
        reservation.setDiscountAmount(discount);
        reservation.setStatus(com.hotelmanagement.model.ReservationStatus.PENDING);
        reservation.setCreatedDate(LocalDate.now());

        return reservationRepository.save(reservation);
    }

    /**
     * Confirms a pending reservation.
     */
    public Reservation confirmReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
        reservation.confirm();
        return reservationRepository.save(reservation);
    }

    /**
     * Re-schedules an existing room reservation.
     *
     * Security: the caller must present the id of the guest who owns the reservation.
     * A mismatch raises AccessDeniedException -> HTTP 403.
     *
     * Business rules enforced server-side:
     *  - only PENDING or CONFIRMED reservations may be changed
     *  - dates must be valid, in the future, and check-out must be after check-in
     *  - guest count must be within 1..20 and within the room capacity
     *  - the room must not be double-booked for the new dates
     *  - the reservation returns to PENDING so staff re-approve the change
     */
    public Reservation rescheduleReservation(Long id, LocalDate newCheckIn, LocalDate newCheckOut,
                                             Integer newGuests, Long actingGuestId) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));

        requireOwnership(reservation.getGuest() != null ? reservation.getGuest().getId() : null,
            actingGuestId);

        if (!ReservationStatus.PENDING.equals(reservation.getStatus())
            && !ReservationStatus.CONFIRMED.equals(reservation.getStatus())) {
            throw new IllegalStateException(
                "Cannot modify a reservation with status: " + reservation.getStatus());
        }

        if (newCheckIn == null || newCheckOut == null) {
            throw new IllegalArgumentException("Both check-in and check-out dates are required");
        }
        if (!newCheckOut.isAfter(newCheckIn)) {
            throw new IllegalArgumentException("Check-out date must be after the check-in date");
        }
        if (newCheckIn.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Check-in date cannot be in the past");
        }

        Integer guests = newGuests != null ? newGuests : reservation.getNumberOfGuests();
        if (guests == null || guests < 1 || guests > 20) {
            throw new IllegalArgumentException("Number of guests must be between 1 and 20");
        }
        if (!reservation.getRoom().canAccommodate(guests)) {
            throw new IllegalArgumentException("Room cannot accommodate " + guests + " guests");
        }

        Room room = reservation.getRoom();
        List<Reservation> conflicts = reservationRepository.findConflictingReservationsExcluding(
            room, ReservationStatus.CANCELLED, newCheckIn, newCheckOut, reservation.getId());
        if (!conflicts.isEmpty()) {
            throw new IllegalStateException(
                "Room " + room.getRoomNumber() + " is not available for the requested dates");
        }

        reservation.setCheckInDate(newCheckIn);
        reservation.setCheckOutDate(newCheckOut);
        reservation.setNumberOfGuests(guests);

        BigDecimal baseTotal = calculateBaseTotal(reservation);
        BigDecimal discount = calculateDiscount(reservation);
        reservation.setTotalPrice(baseTotal.subtract(discount));
        reservation.setDiscountAmount(discount);

        // A changed reservation must be re-approved by staff.
        reservation.setStatus(ReservationStatus.PENDING);
        reservation.setModifiedDate(LocalDate.now());

        return reservationRepository.save(reservation);
    }

    /**
     * Verifies that the acting guest owns the given resource.
     */
    private void requireOwnership(Long ownerGuestId, Long actingGuestId) {
        if (actingGuestId == null) {
            throw new IllegalArgumentException("actingGuestId is required");
        }
        if (ownerGuestId == null || !ownerGuestId.equals(actingGuestId)) {
            throw new com.hotelmanagement.exception.AccessDeniedException(
                "You may only modify your own reservations");
        }
    }

    /**
     * Checks in a confirmed reservation.
     */
    public Reservation checkIn(Long id) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
        reservation.checkIn();
        reservation.getRoom().setStatus(com.hotelmanagement.model.RoomStatus.OCCUPIED);
        roomRepository.save(reservation.getRoom());
        return reservationRepository.save(reservation);
    }

    /**
     * Checks out a reservation.
     */
    public Reservation checkOut(Long id) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
        reservation.checkOut();
        reservation.getRoom().setStatus(com.hotelmanagement.model.RoomStatus.AVAILABLE);
        roomRepository.save(reservation.getRoom());
        return reservationRepository.save(reservation);
    }

    /**
     * Cancels a reservation.
     */
    public Reservation cancelReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
        reservation.cancel();
        return reservationRepository.save(reservation);
    }

    /**
     * Cancels a reservation on behalf of a specific guest, enforcing ownership.
     * Raises AccessDeniedException -> HTTP 403 when the caller is not the owner.
     */
    public Reservation cancelReservationAs(Long id, Long actingGuestId) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));

        requireOwnership(reservation.getGuest() != null ? reservation.getGuest().getId() : null,
            actingGuestId);

        reservation.cancel();
        return reservationRepository.save(reservation);
    }

    /**
     * Admin queue: reservations still awaiting approval.
     */
    public List<Reservation> getPendingReservations() {
        return reservationRepository.findByStatus(ReservationStatus.PENDING);
    }

    /**
     * Returns true when the given guest is the owner of the reservation.
     */
    public boolean isOwner(Long reservationId, Long guestId) {
        if (reservationId == null || guestId == null) {
            return false;
        }
        return reservationRepository.findById(reservationId)
            .map(r -> r.getGuest() != null && guestId.equals(r.getGuest().getId()))
            .orElse(false);
    }


    /**
     * Decision Table Logic: Calculate discount based on multiple conditions
     * Conditions:
     * 1. Length of stay (3+ nights = eligible)
     * 2. Guest age (Senior: 60+, Regular: <60)
     * 3. Guest status (VIP, Regular)
     * 4. Season (Peak, Off-peak)
     */
    public BigDecimal calculateDiscount(Reservation reservation) {
        BigDecimal baseTotal = calculateBaseTotal(reservation);
        BigDecimal discount = BigDecimal.ZERO;

        // Condition 1: Length of stay
        long nights = reservation.getNumberOfNights();
        boolean isLongStay = nights >= 3;

        // Condition 2: Guest age
        Integer guestAge = reservation.getGuest().getAge();
        boolean isSenior = guestAge != null && guestAge >= 60;

        // Condition 3: Is VIP (simplified - based on email domain for testing)
        boolean isVip = reservation.getGuest().getEmail().endsWith("@vip.com");

        // Condition 4: Season (simplified - using month)
        boolean isPeakSeason = isPeakSeason(reservation.getCheckInDate());

        // Decision Table Rules:
        if (isLongStay && isSenior && isVip && !isPeakSeason) {
            // Rule 1: All conditions met - Maximum discount
            discount = baseTotal.multiply(new BigDecimal("0.25")); // 25% discount
        } else if (isLongStay && isSenior && !isPeakSeason) {
            // Rule 2: Long stay + Senior + Off-peak
            discount = baseTotal.multiply(new BigDecimal("0.15")); // 15% discount
        } else if (isLongStay && isVip) {
            // Rule 3: Long stay + VIP
            discount = baseTotal.multiply(new BigDecimal("0.15")); // 15% discount
        } else if (isSenior && !isPeakSeason) {
            // Rule 4: Senior + Off-peak
            discount = baseTotal.multiply(new BigDecimal("0.10")); // 10% discount
        } else if (isLongStay && nights >= 7) {
            // Rule 5: Very long stay (7+ nights)
            discount = baseTotal.multiply(new BigDecimal("0.12")); // 12% discount
        } else if (isLongStay) {
            // Rule 6: Standard long stay discount
            discount = baseTotal.multiply(new BigDecimal("0.05")); // 5% discount
        }

        // Cap discount at base total
        if (discount.compareTo(baseTotal) > 0) {
            discount = baseTotal;
        }

        return discount;
    }

    private BigDecimal calculateBaseTotal(Reservation reservation) {
        long nights = reservation.getNumberOfNights();
        if (nights <= 0) {
            return BigDecimal.ZERO;
        }
        return reservation.getRoom().getBasePrice().multiply(new BigDecimal(nights));
    }

    private boolean isPeakSeason(LocalDate date) {
        int month = date.getMonthValue();
        // Peak season: June, July, August, December, January
        return month == 6 || month == 7 || month == 8 || month == 12 || month == 1;
    }

    private boolean isRoomAvailable(Room room, LocalDate checkIn, LocalDate checkOut) {
        List<Reservation> conflictingReservations = reservationRepository
            .findByRoomAndStatusNotAndCheckOutDateGreaterThanAndCheckInDateLessThan(
                room,
                com.hotelmanagement.model.ReservationStatus.CANCELLED,
                checkIn,
                checkOut
            );
        return conflictingReservations.isEmpty();
    }

    public Optional<Reservation> getReservation(Long id) {
        return reservationRepository.findById(id);
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    public List<Reservation> getReservationsByGuest(Long guestId) {
        return reservationRepository.findByGuestId(guestId);
    }

    public List<Reservation> getReservationsByRoom(Long roomId) {
        return reservationRepository.findByRoomId(roomId);
    }

    /**
     * Permanently removes a reservation record.
     *
     * Used by the booking desk when clearing cancelled or test bookings; the row
     * is removed from the database so the reservation list only ever shows real,
     * currently-tracked stays.
     *
     * @throws IllegalArgumentException when no reservation exists for the id
     */
    public void deleteReservation(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Reservation id is required");
        }
        if (!reservationRepository.existsById(id)) {
            throw new IllegalArgumentException("Reservation not found with ID: " + id);
        }
        reservationRepository.deleteById(id);
    }
}
