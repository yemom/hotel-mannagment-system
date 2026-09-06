package com.hotelmanagement.service;

import com.hotelmanagement.model.Reservation;
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
}
