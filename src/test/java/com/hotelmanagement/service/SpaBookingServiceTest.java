package com.hotelmanagement.service;

import com.hotelmanagement.model.*;
import com.hotelmanagement.repository.GuestRepository;
import com.hotelmanagement.repository.SpaBookingRepository;
import com.hotelmanagement.repository.SpaServiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SpaBookingService Unit, Boundary & State Transition Tests")
class SpaBookingServiceTest {

    private SpaBookingService spaBookingService;

    @Mock
    private SpaBookingRepository spaBookingRepository;

    @Mock
    private SpaServiceRepository spaServiceRepository;

    @Mock
    private GuestRepository guestRepository;

    private Guest sampleGuest;
    private SpaService sampleService;

    @BeforeEach
    void setUp() {
        spaBookingService = new SpaBookingService(spaBookingRepository, spaServiceRepository, guestRepository);

        sampleGuest = Guest.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .password("password123")
                .phone("+251911223344")
                .age(30)
                .status(GuestStatus.ACTIVE)
                .build();

        sampleService = SpaService.builder()
                .id(10L)
                .name("Swedish Relaxation Massage")
                .category(SpaCategory.MASSAGE)
                .durationMinutes(60)
                .price(new BigDecimal("100.00"))
                .capacity(2)
                .active(true)
                .build();
    }

    private SpaBooking.SpaBookingBuilder validBookingBuilder() {
        return SpaBooking.builder()
                .id(100L)
                .guest(sampleGuest)
                .spaService(sampleService)
                .bookingDate(LocalDate.now().plusDays(1))
                .startTime("14:00")
                .numberOfGuests(1)
                .specialRequests("Warm oils preferred");
    }

    @Nested
    @DisplayName("Booking Creation & Calculation Tests")
    class BookingCreationTests {

        @Test
        @DisplayName("Should successfully create valid spa booking")
        void testCreateValidBooking() {
            SpaBooking request = validBookingBuilder().build();

            when(guestRepository.findById(1L)).thenReturn(Optional.of(sampleGuest));
            when(spaServiceRepository.findById(10L)).thenReturn(Optional.of(sampleService));
            when(spaBookingRepository.findBySpaServiceAndBookingDateAndStartTimeAndStatusNot(
                    any(), any(), any(), any())).thenReturn(Collections.emptyList());
            when(spaBookingRepository.save(any(SpaBooking.class))).thenAnswer(inv -> inv.getArgument(0));

            SpaBooking created = spaBookingService.createBooking(request);

            assertThat(created).isNotNull();
            assertThat(created.getStatus()).isEqualTo(SpaBookingStatus.PENDING);
            assertThat(created.getDuration()).isEqualTo(60);
            assertThat(created.getTotalPrice()).isEqualByComparingTo("100.00");
            assertThat(created.getGuest().getId()).isEqualTo(1L);
            assertThat(created.getSpaService().getId()).isEqualTo(10L);
        }

        @Test
        @DisplayName("Should calculate total price correctly for multiple guests")
        void testTotalPriceCalculationForMultipleGuests() {
            sampleService.setCapacity(4);
            SpaBooking request = validBookingBuilder().numberOfGuests(3).build();

            when(guestRepository.findById(1L)).thenReturn(Optional.of(sampleGuest));
            when(spaServiceRepository.findById(10L)).thenReturn(Optional.of(sampleService));
            when(spaBookingRepository.findBySpaServiceAndBookingDateAndStartTimeAndStatusNot(
                    any(), any(), any(), any())).thenReturn(Collections.emptyList());
            when(spaBookingRepository.save(any(SpaBooking.class))).thenAnswer(inv -> inv.getArgument(0));

            SpaBooking created = spaBookingService.createBooking(request);

            // 100.00 * 3 = 300.00
            assertThat(created.getTotalPrice()).isEqualByComparingTo("300.00");
        }
    }

    @Nested
    @DisplayName("Boundary Value Testing: Guest Count & Capacity")
    class GuestCountBoundaryTests {

        @ParameterizedTest
        @ValueSource(ints = {1, 2})
        @DisplayName("Guest count within capacity boundary [1, 2] should be accepted")
        void testValidGuestCountBoundaries(int guestCount) {
            SpaBooking request = validBookingBuilder().numberOfGuests(guestCount).build();

            when(guestRepository.findById(1L)).thenReturn(Optional.of(sampleGuest));
            when(spaServiceRepository.findById(10L)).thenReturn(Optional.of(sampleService));
            when(spaBookingRepository.findBySpaServiceAndBookingDateAndStartTimeAndStatusNot(
                    any(), any(), any(), any())).thenReturn(Collections.emptyList());
            when(spaBookingRepository.save(any(SpaBooking.class))).thenAnswer(inv -> inv.getArgument(0));

            SpaBooking created = spaBookingService.createBooking(request);
            assertThat(created.getNumberOfGuests()).isEqualTo(guestCount);
        }

        @ParameterizedTest
        @ValueSource(ints = {0, -1, 3, 21})
        @DisplayName("Invalid guest count (0, negative, >capacity, >20) should be rejected")
        void testInvalidGuestCountBoundaries(int invalidGuests) {
            SpaBooking request = validBookingBuilder().numberOfGuests(invalidGuests).build();

            if (invalidGuests >= 1 && invalidGuests <= 20) {
                when(guestRepository.findById(1L)).thenReturn(Optional.of(sampleGuest));
                when(spaServiceRepository.findById(10L)).thenReturn(Optional.of(sampleService));
            }

            assertThatThrownBy(() -> spaBookingService.createBooking(request))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("Boundary Value Testing: Booking Date & Time")
    class DateAndTimeBoundaryTests {

        @Test
        @DisplayName("Booking for today should be accepted")
        void testBookingForTodayAccepted() {
            SpaBooking request = validBookingBuilder().bookingDate(LocalDate.now()).build();

            when(guestRepository.findById(1L)).thenReturn(Optional.of(sampleGuest));
            when(spaServiceRepository.findById(10L)).thenReturn(Optional.of(sampleService));
            when(spaBookingRepository.findBySpaServiceAndBookingDateAndStartTimeAndStatusNot(
                    any(), any(), any(), any())).thenReturn(Collections.emptyList());
            when(spaBookingRepository.save(any(SpaBooking.class))).thenAnswer(inv -> inv.getArgument(0));

            SpaBooking created = spaBookingService.createBooking(request);
            assertThat(created.getBookingDate()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("Booking for past date must be rejected")
        void testPastDateRejected() {
            SpaBooking request = validBookingBuilder().bookingDate(LocalDate.now().minusDays(1)).build();

            assertThatThrownBy(() -> spaBookingService.createBooking(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("past");
        }

        @ParameterizedTest
        @ValueSource(strings = {"09:00", "12:30", "18:45", "23:59"})
        @DisplayName("Valid start times in HH:mm format should be accepted")
        void testValidStartTimes(String time) {
            SpaBooking request = validBookingBuilder().startTime(time).build();

            when(guestRepository.findById(1L)).thenReturn(Optional.of(sampleGuest));
            when(spaServiceRepository.findById(10L)).thenReturn(Optional.of(sampleService));
            when(spaBookingRepository.findBySpaServiceAndBookingDateAndStartTimeAndStatusNot(
                    any(), any(), any(), any())).thenReturn(Collections.emptyList());
            when(spaBookingRepository.save(any(SpaBooking.class))).thenAnswer(inv -> inv.getArgument(0));

            SpaBooking created = spaBookingService.createBooking(request);
            assertThat(created.getStartTime()).isEqualTo(time);
        }

        @ParameterizedTest
        @ValueSource(strings = {"9:00", "25:00", "12:60", "invalid", "", "   "})
        @DisplayName("Invalid start times should be rejected")
        void testInvalidStartTimes(String invalidTime) {
            SpaBooking request = validBookingBuilder().startTime(invalidTime).build();

            assertThatThrownBy(() -> spaBookingService.createBooking(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("time");
        }
    }

    @Nested
    @DisplayName("Validation Rules: Guest & Service Status")
    class StatusValidationTests {

        @Test
        @DisplayName("Cannot book when guest account is SUSPENDED")
        void testSuspendedGuestCannotBook() {
            sampleGuest.setStatus(GuestStatus.SUSPENDED);
            SpaBooking request = validBookingBuilder().build();

            when(guestRepository.findById(1L)).thenReturn(Optional.of(sampleGuest));

            assertThatThrownBy(() -> spaBookingService.createBooking(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("active");
        }

        @Test
        @DisplayName("Cannot book an inactive spa service")
        void testInactiveServiceCannotBeBooked() {
            sampleService.setActive(false);
            SpaBooking request = validBookingBuilder().build();

            when(guestRepository.findById(1L)).thenReturn(Optional.of(sampleGuest));
            when(spaServiceRepository.findById(10L)).thenReturn(Optional.of(sampleService));

            assertThatThrownBy(() -> spaBookingService.createBooking(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("inactive");
        }
    }

    @Nested
    @DisplayName("Capacity Conflict Validation")
    class CapacityConflictTests {

        @Test
        @DisplayName("Should reject booking when slot capacity is fully booked")
        void testSlotCapacityExceededConflict() {
            // Service capacity is 2
            SpaBooking existing = validBookingBuilder()
                    .id(50L)
                    .numberOfGuests(2)
                    .status(SpaBookingStatus.CONFIRMED)
                    .build();

            SpaBooking incoming = validBookingBuilder()
                    .id(null)
                    .numberOfGuests(1)
                    .build();

            when(guestRepository.findById(1L)).thenReturn(Optional.of(sampleGuest));
            when(spaServiceRepository.findById(10L)).thenReturn(Optional.of(sampleService));
            when(spaBookingRepository.findBySpaServiceAndBookingDateAndStartTimeAndStatusNot(
                    sampleService, incoming.getBookingDate(), incoming.getStartTime(), SpaBookingStatus.CANCELLED))
                    .thenReturn(List.of(existing));

            assertThatThrownBy(() -> spaBookingService.createBooking(incoming))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Capacity conflict");
        }

        @Test
        @DisplayName("Cancelled booking should free up capacity for new booking")
        void testCancelledBookingDoesNotBlockCapacity() {
            // Cancelled booking does not consume slot capacity
            SpaBooking incoming = validBookingBuilder().numberOfGuests(2).build();

            when(guestRepository.findById(1L)).thenReturn(Optional.of(sampleGuest));
            when(spaServiceRepository.findById(10L)).thenReturn(Optional.of(sampleService));
            when(spaBookingRepository.findBySpaServiceAndBookingDateAndStartTimeAndStatusNot(
                    sampleService, incoming.getBookingDate(), incoming.getStartTime(), SpaBookingStatus.CANCELLED))
                    .thenReturn(Collections.emptyList());
            when(spaBookingRepository.save(any(SpaBooking.class))).thenAnswer(inv -> inv.getArgument(0));

            SpaBooking created = spaBookingService.createBooking(incoming);
            assertThat(created).isNotNull();
        }
    }

    @Nested
    @DisplayName("State Transition Testing")
    class StateTransitionTests {

        @Test
        @DisplayName("Valid transition: PENDING -> CONFIRMED")
        void testPendingToConfirmed() {
            SpaBooking booking = validBookingBuilder().status(SpaBookingStatus.PENDING).build();
            when(spaBookingRepository.findById(100L)).thenReturn(Optional.of(booking));
            when(spaBookingRepository.save(any(SpaBooking.class))).thenAnswer(inv -> inv.getArgument(0));

            SpaBooking confirmed = spaBookingService.confirmBooking(100L);
            assertThat(confirmed.getStatus()).isEqualTo(SpaBookingStatus.CONFIRMED);
        }

        @Test
        @DisplayName("Valid transition: PENDING -> CANCELLED")
        void testPendingToCancelled() {
            SpaBooking booking = validBookingBuilder().status(SpaBookingStatus.PENDING).build();
            when(spaBookingRepository.findById(100L)).thenReturn(Optional.of(booking));
            when(spaBookingRepository.save(any(SpaBooking.class))).thenAnswer(inv -> inv.getArgument(0));

            SpaBooking cancelled = spaBookingService.cancelBooking(100L);
            assertThat(cancelled.getStatus()).isEqualTo(SpaBookingStatus.CANCELLED);
        }

        @Test
        @DisplayName("Valid transition: CONFIRMED -> COMPLETED")
        void testConfirmedToCompleted() {
            SpaBooking booking = validBookingBuilder().status(SpaBookingStatus.CONFIRMED).build();
            when(spaBookingRepository.findById(100L)).thenReturn(Optional.of(booking));
            when(spaBookingRepository.save(any(SpaBooking.class))).thenAnswer(inv -> inv.getArgument(0));

            SpaBooking completed = spaBookingService.completeBooking(100L);
            assertThat(completed.getStatus()).isEqualTo(SpaBookingStatus.COMPLETED);
        }

        @Test
        @DisplayName("Valid transition: CONFIRMED -> CANCELLED")
        void testConfirmedToCancelled() {
            SpaBooking booking = validBookingBuilder().status(SpaBookingStatus.CONFIRMED).build();
            when(spaBookingRepository.findById(100L)).thenReturn(Optional.of(booking));
            when(spaBookingRepository.save(any(SpaBooking.class))).thenAnswer(inv -> inv.getArgument(0));

            SpaBooking cancelled = spaBookingService.cancelBooking(100L);
            assertThat(cancelled.getStatus()).isEqualTo(SpaBookingStatus.CANCELLED);
        }

        @Test
        @DisplayName("Invalid transition: CANCELLED -> CONFIRMED should be rejected")
        void testCancelledToConfirmedRejected() {
            SpaBooking booking = validBookingBuilder().status(SpaBookingStatus.CANCELLED).build();
            when(spaBookingRepository.findById(100L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> spaBookingService.confirmBooking(100L))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot confirm");
        }

        @Test
        @DisplayName("Invalid transition: COMPLETED -> CANCELLED should be rejected")
        void testCompletedToCancelledRejected() {
            SpaBooking booking = validBookingBuilder().status(SpaBookingStatus.COMPLETED).build();
            when(spaBookingRepository.findById(100L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> spaBookingService.cancelBooking(100L))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot cancel");
        }

        @Test
        @DisplayName("Invalid transition: PENDING -> COMPLETED should be rejected")
        void testPendingToCompletedRejected() {
            SpaBooking booking = validBookingBuilder().status(SpaBookingStatus.PENDING).build();
            when(spaBookingRepository.findById(100L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> spaBookingService.completeBooking(100L))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot complete");
        }
    }
}
