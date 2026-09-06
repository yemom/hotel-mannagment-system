package com.hotelmanagement.service;

import com.hotelmanagement.model.*;
import com.hotelmanagement.repository.ReservationRepository;
import com.hotelmanagement.repository.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ReservationService including decision table tests for discount logic
 * and state transition tests for reservation status workflow.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ReservationService Unit Tests")
class ReservationServiceTest {

    private ReservationService reservationService;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private PricingService pricingService;

    @BeforeEach
    void setUp() {
        reservationService = new ReservationService(reservationRepository, roomRepository, pricingService);
    }

    // ===== Decision Table Tests: Discount Calculation =====
    /**
     * Decision table factors:
     * 1. Length of stay (3+ nights = eligible)
     * 2. Guest age (Senior: 60+, Regular: <60)
     * 3. Guest status (VIP, Regular)
     * 4. Season (Peak, Off-peak)
     */
    @Nested
    @DisplayName("Discount Calculation Decision Table Tests")
    class DiscountCalculationTests {

        private Guest seniorVip;
        private Guest seniorRegular;
        private Guest youngVip;
        private Guest youngRegular;
        private Room room;

        @BeforeEach
        void setUp() {
            // Senior VIP Guest
            seniorVip = Guest.builder()
                .id(1L)
                .firstName("Senior")
                .lastName("VIP")
                .email("senior@vip.com")
                .age(65)
                .status(GuestStatus.ACTIVE)
                .build();

            // Senior Regular Guest
            seniorRegular = Guest.builder()
                .id(2L)
                .firstName("Senior")
                .lastName("Regular")
                .email("senior@regular.com")
                .age(70)
                .status(GuestStatus.ACTIVE)
                .build();

            // Young VIP Guest
            youngVip = Guest.builder()
                .id(3L)
                .firstName("Young")
                .lastName("VIP")
                .email("young@vip.com")
                .age(30)
                .status(GuestStatus.ACTIVE)
                .build();

            // Young Regular Guest
            youngRegular = Guest.builder()
                .id(4L)
                .firstName("Young")
                .lastName("Regular")
                .email("young@regular.com")
                .age(25)
                .status(GuestStatus.ACTIVE)
                .build();

            // Room with base price
            room = Room.builder()
                .id(1L)
                .roomNumber("101")
                .roomType(RoomType.DOUBLE)
                .basePrice(new BigDecimal("100"))
                .capacity(2)
                .status(RoomStatus.AVAILABLE)
                .build();
        }

        @Test
        @DisplayName("Decision Table: All conditions met (Senior VIP, Long stay, Off-peak) -> 25% discount")
        void testMaximumDiscount() {
            // All conditions: Long stay YES, Senior YES, VIP YES, Off-peak YES
            Reservation reservation = Reservation.builder()
                .guest(seniorVip)
                .room(room)
                .checkInDate(LocalDate.of(2026, 9, 5))    // Off-peak (September)
                .checkOutDate(LocalDate.of(2026, 9, 8))   // 3 nights
                .numberOfGuests(2)
                .build();

            BigDecimal discount = reservationService.calculateDiscount(reservation);
            BigDecimal expectedDiscount = new BigDecimal("100").multiply(new BigDecimal("3"))
                .multiply(new BigDecimal("0.25")); // 25%

            assertThat(discount).isEqualByComparingTo(expectedDiscount);
        }

        @Test
        @DisplayName("Decision Table: Senior + Long stay + Off-peak (no VIP) -> 15% discount")
        void testSeniorLongStayOffPeakDiscount() {
            // Conditions: Long stay YES, Senior YES, VIP NO, Off-peak YES
            Reservation reservation = Reservation.builder()
                .guest(seniorRegular)
                .room(room)
                .checkInDate(LocalDate.of(2026, 9, 5))
                .checkOutDate(LocalDate.of(2026, 9, 8))   // 3 nights
                .numberOfGuests(2)
                .build();

            BigDecimal discount = reservationService.calculateDiscount(reservation);
            BigDecimal expectedDiscount = new BigDecimal("100").multiply(new BigDecimal("3"))
                .multiply(new BigDecimal("0.15")); // 15%

            assertThat(discount).isEqualByComparingTo(expectedDiscount);
        }

        @Test
        @DisplayName("Decision Table: VIP + Long stay (no senior, any season) -> 15% discount")
        void testVipLongStayDiscount() {
            // Conditions: Long stay YES, Senior NO, VIP YES
            Reservation reservation = Reservation.builder()
                .guest(youngVip)
                .room(room)
                .checkInDate(LocalDate.of(2026, 7, 5))    // Peak season (July)
                .checkOutDate(LocalDate.of(2026, 7, 8))   // 3 nights
                .numberOfGuests(2)
                .build();

            BigDecimal discount = reservationService.calculateDiscount(reservation);
            BigDecimal expectedDiscount = new BigDecimal("100").multiply(new BigDecimal("3"))
                .multiply(new BigDecimal("0.15")); // 15%

            assertThat(discount).isEqualByComparingTo(expectedDiscount);
        }

        @Test
        @DisplayName("Decision Table: Senior + Off-peak (no VIP, short stay) -> 10% discount")
        void testSeniorOffPeakDiscount() {
            // Conditions: Long stay NO, Senior YES, VIP NO, Off-peak YES
            Reservation reservation = Reservation.builder()
                .guest(seniorRegular)
                .room(room)
                .checkInDate(LocalDate.of(2026, 9, 5))
                .checkOutDate(LocalDate.of(2026, 9, 6))   // 1 night only
                .numberOfGuests(2)
                .build();

            BigDecimal discount = reservationService.calculateDiscount(reservation);
            BigDecimal expectedDiscount = new BigDecimal("100").multiply(new BigDecimal("1"))
                .multiply(new BigDecimal("0.10")); // 10%

            assertThat(discount).isEqualByComparingTo(expectedDiscount);
        }

        @Test
        @DisplayName("Decision Table: Very long stay (7+ nights) -> 12% discount")
        void testVeryLongStayDiscount() {
            // Conditions: Very long stay (7+ nights)
            Reservation reservation = Reservation.builder()
                .guest(youngRegular)
                .room(room)
                .checkInDate(LocalDate.of(2026, 7, 1))
                .checkOutDate(LocalDate.of(2026, 7, 9))   // 8 nights, peak season
                .numberOfGuests(2)
                .build();

            BigDecimal discount = reservationService.calculateDiscount(reservation);
            BigDecimal expectedDiscount = new BigDecimal("100").multiply(new BigDecimal("8"))
                .multiply(new BigDecimal("0.12")); // 12%

            assertThat(discount).isEqualByComparingTo(expectedDiscount);
        }

        @Test
        @DisplayName("Decision Table: Standard long stay (3-6 nights, no other conditions) -> 5% discount")
        void testStandardLongStayDiscount() {
            // Conditions: Long stay YES, Senior NO, VIP NO, Peak season
            Reservation reservation = Reservation.builder()
                .guest(youngRegular)
                .room(room)
                .checkInDate(LocalDate.of(2026, 6, 1))    // Peak season
                .checkOutDate(LocalDate.of(2026, 6, 5))   // 4 nights
                .numberOfGuests(2)
                .build();

            BigDecimal discount = reservationService.calculateDiscount(reservation);
            BigDecimal expectedDiscount = new BigDecimal("100").multiply(new BigDecimal("4"))
                .multiply(new BigDecimal("0.05")); // 5%

            assertThat(discount).isEqualByComparingTo(expectedDiscount);
        }

        @Test
        @DisplayName("Decision Table: Short stay, young, regular, peak -> No discount")
        void testNoDiscount() {
            // Conditions: All false (no discounts)
            Reservation reservation = Reservation.builder()
                .guest(youngRegular)
                .room(room)
                .checkInDate(LocalDate.of(2026, 7, 1))    // Peak season
                .checkOutDate(LocalDate.of(2026, 7, 2))   // 1 night only
                .numberOfGuests(2)
                .build();

            BigDecimal discount = reservationService.calculateDiscount(reservation);

            assertThat(discount).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    // ===== State Transition Tests =====
    @Nested
    @DisplayName("Reservation State Transition Tests")
    class StateTransitionTests {

        private Reservation reservation;
        private Guest guest;
        private Room room;

        @BeforeEach
        void setUp() {
            guest = Guest.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .age(30)
                .status(GuestStatus.ACTIVE)
                .build();

            room = Room.builder()
                .id(1L)
                .roomNumber("101")
                .roomType(RoomType.DOUBLE)
                .basePrice(new BigDecimal("100"))
                .capacity(2)
                .status(RoomStatus.AVAILABLE)
                .build();

            reservation = Reservation.builder()
                .id(1L)
                .guest(guest)
                .room(room)
                .checkInDate(LocalDate.now())
                .checkOutDate(LocalDate.now().plusDays(3))
                .numberOfGuests(2)
                .totalPrice(new BigDecimal("300"))
                .discountAmount(BigDecimal.ZERO)
                .status(ReservationStatus.PENDING)
                .build();
        }

        @Test
        @DisplayName("State Transition: PENDING -> CONFIRMED")
        void testConfirmPendingReservation() {
            // Arrange
            when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
            when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            Reservation result = reservationService.confirmReservation(1L);

            // Assert
            assertThat(result.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
            verify(reservationRepository, times(1)).save(any(Reservation.class));
        }

        @Test
        @DisplayName("State Transition: Cannot confirm non-PENDING reservation")
        void testCannotConfirmConfirmedReservation() {
            // Arrange
            reservation.setStatus(ReservationStatus.CONFIRMED);

            // Act & Assert
            assertThatThrownBy(reservation::confirm)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot confirm");
        }

        @Test
        @DisplayName("State Transition: CONFIRMED -> CHECKED_IN")
        void testCheckInConfirmedReservation() {
            // Arrange
            reservation.setStatus(ReservationStatus.CONFIRMED);
            when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
            when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
            when(roomRepository.save(any(Room.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            Reservation result = reservationService.checkIn(1L);

            // Assert
            assertThat(result.getStatus()).isEqualTo(ReservationStatus.CHECKED_IN);
            assertThat(result.getRoom().getStatus()).isEqualTo(RoomStatus.OCCUPIED);
        }

        @Test
        @DisplayName("State Transition: CHECKED_IN -> CHECKED_OUT")
        void testCheckOutCheckedInReservation() {
            // Arrange
            reservation.setStatus(ReservationStatus.CHECKED_IN);
            when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
            when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
            when(roomRepository.save(any(Room.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            Reservation result = reservationService.checkOut(1L);

            // Assert
            assertThat(result.getStatus()).isEqualTo(ReservationStatus.CHECKED_OUT);
            assertThat(result.getRoom().getStatus()).isEqualTo(RoomStatus.AVAILABLE);
        }

        @Test
        @DisplayName("State Transition: PENDING -> CANCELLED")
        void testCancelPendingReservation() {
            // Arrange
            when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
            when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            Reservation result = reservationService.cancelReservation(1L);

            // Assert
            assertThat(result.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
        }

        @Test
        @DisplayName("State Transition: CONFIRMED -> CANCELLED")
        void testCancelConfirmedReservation() {
            // Arrange
            reservation.setStatus(ReservationStatus.CONFIRMED);
            when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
            when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            Reservation result = reservationService.cancelReservation(1L);

            // Assert
            assertThat(result.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
        }

        @Test
        @DisplayName("State Transition: Cannot cancel CHECKED_IN reservation")
        void testCannotCancelCheckedInReservation() {
            // Arrange
            reservation.setStatus(ReservationStatus.CHECKED_IN);

            // Act & Assert
            assertThatThrownBy(reservation::cancel)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot cancel");
        }

        @Test
        @DisplayName("State Transition: Cannot transition from invalid states")
        void testInvalidStateTransitions() {
            // Arrange
            reservation.setStatus(ReservationStatus.CHECKED_OUT);

            // Act & Assert
            assertThatThrownBy(reservation::confirm)
                .isInstanceOf(IllegalStateException.class);
            assertThatThrownBy(reservation::checkIn)
                .isInstanceOf(IllegalStateException.class);
            assertThatThrownBy(reservation::checkOut)
                .isInstanceOf(IllegalStateException.class);
        }
    }

    // ===== Date Validation and Equivalence Partitioning Tests =====
    @Nested
    @DisplayName("Reservation Creation and Validation Tests")
    class ReservationCreationTests {

        private Guest guest;
        private Room room;

        @BeforeEach
        void setUp() {
            guest = Guest.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .age(30)
                .status(GuestStatus.ACTIVE)
                .build();

            room = Room.builder()
                .id(1L)
                .roomNumber("101")
                .roomType(RoomType.DOUBLE)
                .basePrice(new BigDecimal("100"))
                .capacity(2)
                .status(RoomStatus.AVAILABLE)
                .build();
        }

        @Test
        @DisplayName("Should reject reservation with invalid date range (checkout before checkin)")
        void testInvalidDateRange() {
            // Arrange
            Reservation reservation = Reservation.builder()
                .guest(guest)
                .room(room)
                .checkInDate(LocalDate.of(2026, 9, 10))
                .checkOutDate(LocalDate.of(2026, 9, 8))
                .numberOfGuests(2)
                .build();

            // Act & Assert
            assertThatThrownBy(() -> reservationService.createReservation(reservation))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid date range");
        }

        @Test
        @DisplayName("Should reject reservation with same checkout and checkin date")
        void testSameDateCheckInCheckOut() {
            // Arrange
            Reservation reservation = Reservation.builder()
                .guest(guest)
                .room(room)
                .checkInDate(LocalDate.of(2026, 9, 10))
                .checkOutDate(LocalDate.of(2026, 9, 10))
                .numberOfGuests(2)
                .build();

            // Act & Assert
            assertThatThrownBy(() -> reservationService.createReservation(reservation))
                .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Should reject reservation with invalid guest count (zero)")
        void testZeroGuestCount() {
            // Arrange
            Reservation reservation = Reservation.builder()
                .guest(guest)
                .room(room)
                .checkInDate(LocalDate.of(2026, 9, 10))
                .checkOutDate(LocalDate.of(2026, 9, 12))
                .numberOfGuests(0)
                .build();

            // Act & Assert
            assertThatThrownBy(() -> reservationService.createReservation(reservation))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid number of guests");
        }

        @Test
        @DisplayName("Should reject reservation exceeding room capacity")
        void testGuestCountExceedsCapacity() {
            // Arrange
            room.setCapacity(2);
            Reservation reservation = Reservation.builder()
                .guest(guest)
                .room(room)
                .checkInDate(LocalDate.of(2026, 9, 10))
                .checkOutDate(LocalDate.of(2026, 9, 12))
                .numberOfGuests(5)
                .build();

            // Act & Assert
            assertThatThrownBy(() -> reservationService.createReservation(reservation))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot accommodate");
        }

        @Test
        @DisplayName("Should create valid reservation successfully")
        void testCreateValidReservation() {
            // Arrange
            Reservation reservation = Reservation.builder()
                .guest(guest)
                .room(room)
                .checkInDate(LocalDate.of(2026, 9, 10))
                .checkOutDate(LocalDate.of(2026, 9, 13))
                .numberOfGuests(2)
                .build();

            when(reservationRepository.findByRoomAndStatusNotAndCheckOutDateGreaterThanAndCheckInDateLessThan(
                any(Room.class), any(ReservationStatus.class), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
            when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            Reservation result = reservationService.createReservation(reservation);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(ReservationStatus.PENDING);
            assertThat(result.getTotalPrice()).isGreaterThan(BigDecimal.ZERO);
        }
    }
}
