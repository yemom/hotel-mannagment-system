package com.hotelmanagement.service;

import com.hotelmanagement.model.Guest;
import com.hotelmanagement.model.RestaurantTable;
import com.hotelmanagement.model.TableReservation;
import com.hotelmanagement.model.TableReservationStatus;
import com.hotelmanagement.model.TableStatus;
import com.hotelmanagement.repository.GuestRepository;
import com.hotelmanagement.repository.RestaurantTableRepository;
import com.hotelmanagement.repository.TableReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TableReservationService Unit Tests with Test Doubles")
class TableReservationServiceTest {

    @Mock
    private TableReservationRepository reservationRepository;

    @Mock
    private GuestRepository guestRepository;

    @Mock
    private RestaurantTableRepository tableRepository;

    @InjectMocks
    private TableReservationService service;

    private Guest testGuest;
    private RestaurantTable testTable;

    @BeforeEach
    void setUp() {
        testGuest = Guest.builder()
                .id(1L)
                .firstName("Eyasu")
                .lastName("User")
                .email("eyasu@example.com")
                .build();

        testTable = RestaurantTable.builder()
                .id(10L)
                .tableNumber("T-01")
                .capacity(4)
                .status(TableStatus.AVAILABLE)
                .build();
    }

    // ==========================================
    // 1. BOUNDARY VALUE ANALYSIS & VALIDATION
    // ==========================================

    @Test
    @DisplayName("BVA: Should create table reservation with valid minimum party size (1)")
    void testCreateReservationMinPartySize() {
        TableReservation res = TableReservation.builder()
                .reservationDate(LocalDate.now().plusDays(1))
                .timeSlot("19:00 - 21:00")
                .partySize(1)
                .guest(testGuest)
                .restaurantTable(testTable)
                .build();

        when(guestRepository.findById(1L)).thenReturn(Optional.of(testGuest));
        when(tableRepository.findById(10L)).thenReturn(Optional.of(testTable));
        when(reservationRepository.save(any(TableReservation.class))).thenAnswer(i -> i.getArgument(0));

        TableReservation created = service.create(res);

        assertThat(created).isNotNull();
        assertThat(created.getStatus()).isEqualTo(TableReservationStatus.PENDING);
        assertThat(created.getPartySize()).isEqualTo(1);
    }

    @Test
    @DisplayName("BVA: Should create table reservation with valid maximum party size (20)")
    void testCreateReservationMaxPartySize() {
        TableReservation res = TableReservation.builder()
                .reservationDate(LocalDate.now().plusDays(1))
                .timeSlot("19:00 - 21:00")
                .partySize(20)
                .guest(testGuest)
                .restaurantTable(testTable)
                .build();

        when(guestRepository.findById(1L)).thenReturn(Optional.of(testGuest));
        when(tableRepository.findById(10L)).thenReturn(Optional.of(testTable));
        when(reservationRepository.save(any(TableReservation.class))).thenAnswer(i -> i.getArgument(0));

        TableReservation created = service.create(res);

        assertThat(created.getPartySize()).isEqualTo(20);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, -5})
    @DisplayName("BVA: Should reject party size less than 1")
    void testCreateReservationInvalidLowPartySize(int invalidSize) {
        TableReservation res = TableReservation.builder()
                .reservationDate(LocalDate.now().plusDays(1))
                .timeSlot("19:00 - 21:00")
                .partySize(invalidSize)
                .guest(testGuest)
                .build();

        assertThatThrownBy(() -> service.create(res))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Party size must be at least 1");
    }

    @Test
    @DisplayName("BVA: Should reject party size greater than 20")
    void testCreateReservationExceedMaxPartySize() {
        TableReservation res = TableReservation.builder()
                .reservationDate(LocalDate.now().plusDays(1))
                .timeSlot("19:00 - 21:00")
                .partySize(21)
                .guest(testGuest)
                .build();

        assertThatThrownBy(() -> service.create(res))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Party size cannot exceed 20");
    }

    @Test
    @DisplayName("Validation: Should reject null reservation date")
    void testCreateReservationNullDate() {
        TableReservation res = TableReservation.builder()
                .timeSlot("19:00 - 21:00")
                .partySize(2)
                .guest(testGuest)
                .build();

        assertThatThrownBy(() -> service.create(res))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Reservation date is required");
    }

    @Test
    @DisplayName("Validation: Should reject blank or null time slot")
    void testCreateReservationBlankTimeSlot() {
        TableReservation res = TableReservation.builder()
                .reservationDate(LocalDate.now().plusDays(1))
                .timeSlot("  ")
                .partySize(2)
                .guest(testGuest)
                .build();

        assertThatThrownBy(() -> service.create(res))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Time slot is required");
    }

    @Test
    @DisplayName("Validation: Should reject missing guest")
    void testCreateReservationMissingGuest() {
        TableReservation res = TableReservation.builder()
                .reservationDate(LocalDate.now().plusDays(1))
                .timeSlot("19:00 - 21:00")
                .partySize(2)
                .build();

        assertThatThrownBy(() -> service.create(res))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Guest is required");
    }

    @Test
    @DisplayName("Validation: Should throw exception when guest ID does not exist")
    void testCreateReservationNonExistentGuest() {
        TableReservation res = TableReservation.builder()
                .reservationDate(LocalDate.now().plusDays(1))
                .timeSlot("19:00 - 21:00")
                .partySize(2)
                .guest(Guest.builder().id(999L).build())
                .build();

        when(guestRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(res))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Guest not found");
    }

    // ==========================================
    // 2. STATE TRANSITION TESTING
    // ==========================================

    @Test
    @DisplayName("State Transition: Confirm table reservation (PENDING -> CONFIRMED)")
    void testConfirmReservation() {
        TableReservation res = TableReservation.builder()
                .id(100L)
                .status(TableReservationStatus.PENDING)
                .build();

        when(reservationRepository.findById(100L)).thenReturn(Optional.of(res));
        when(reservationRepository.save(any(TableReservation.class))).thenAnswer(i -> i.getArgument(0));

        TableReservation updated = service.confirm(100L);
        assertThat(updated.getStatus()).isEqualTo(TableReservationStatus.CONFIRMED);
    }

    @Test
    @DisplayName("State Transition: Seat guest (CONFIRMED -> SEATED) marks table OCCUPIED")
    void testSeatReservation() {
        TableReservation res = TableReservation.builder()
                .id(101L)
                .status(TableReservationStatus.CONFIRMED)
                .restaurantTable(testTable)
                .build();

        when(reservationRepository.findById(101L)).thenReturn(Optional.of(res));
        when(reservationRepository.save(any(TableReservation.class))).thenAnswer(i -> i.getArgument(0));

        TableReservation updated = service.seat(101L);
        assertThat(updated.getStatus()).isEqualTo(TableReservationStatus.SEATED);
        assertThat(testTable.getStatus()).isEqualTo(TableStatus.OCCUPIED);
    }

    @Test
    @DisplayName("State Transition: Complete reservation (SEATED -> COMPLETED) frees table")
    void testCompleteReservation() {
        testTable.setStatus(TableStatus.OCCUPIED);
        TableReservation res = TableReservation.builder()
                .id(102L)
                .status(TableReservationStatus.SEATED)
                .restaurantTable(testTable)
                .build();

        when(reservationRepository.findById(102L)).thenReturn(Optional.of(res));
        when(reservationRepository.save(any(TableReservation.class))).thenAnswer(i -> i.getArgument(0));

        TableReservation updated = service.complete(102L);
        assertThat(updated.getStatus()).isEqualTo(TableReservationStatus.COMPLETED);
        assertThat(testTable.getStatus()).isEqualTo(TableStatus.AVAILABLE);
    }

    @Test
    @DisplayName("State Transition: Cancel reservation frees table")
    void testCancelReservation() {
        testTable.setStatus(TableStatus.OCCUPIED);
        TableReservation res = TableReservation.builder()
                .id(103L)
                .status(TableReservationStatus.CONFIRMED)
                .restaurantTable(testTable)
                .build();

        when(reservationRepository.findById(103L)).thenReturn(Optional.of(res));
        when(reservationRepository.save(any(TableReservation.class))).thenAnswer(i -> i.getArgument(0));

        TableReservation updated = service.cancel(103L);
        assertThat(updated.getStatus()).isEqualTo(TableReservationStatus.CANCELLED);
        assertThat(testTable.getStatus()).isEqualTo(TableStatus.AVAILABLE);
    }

    @Test
    @DisplayName("State Transition: Mark No-Show frees table")
    void testMarkNoShow() {
        TableReservation res = TableReservation.builder()
                .id(104L)
                .status(TableReservationStatus.CONFIRMED)
                .restaurantTable(testTable)
                .build();

        when(reservationRepository.findById(104L)).thenReturn(Optional.of(res));
        when(reservationRepository.save(any(TableReservation.class))).thenAnswer(i -> i.getArgument(0));

        TableReservation updated = service.markNoShow(104L);
        assertThat(updated.getStatus()).isEqualTo(TableReservationStatus.NO_SHOW);
        assertThat(testTable.getStatus()).isEqualTo(TableStatus.AVAILABLE);
    }

    // ==========================================
    // 3. RETRIEVAL & DELETION TESTS
    // ==========================================

    @Test
    @DisplayName("Should retrieve reservations by guest ID and date")
    void testFindQueries() {
        LocalDate date = LocalDate.now();
        when(reservationRepository.findAll()).thenReturn(List.of(new TableReservation()));
        when(reservationRepository.findByGuestId(1L)).thenReturn(List.of(new TableReservation()));
        when(reservationRepository.findByReservationDate(date)).thenReturn(List.of(new TableReservation()));

        assertThat(service.getAll()).hasSize(1);
        assertThat(service.getByGuestId(1L)).hasSize(1);
        assertThat(service.getByDate(date)).hasSize(1);
    }

    @Test
    @DisplayName("Should delete reservation and restore table if seated")
    void testDeleteReservation() {
        testTable.setStatus(TableStatus.OCCUPIED);
        TableReservation res = TableReservation.builder()
                .id(105L)
                .status(TableReservationStatus.SEATED)
                .restaurantTable(testTable)
                .build();

        when(reservationRepository.findById(105L)).thenReturn(Optional.of(res));

        service.delete(105L);

        assertThat(testTable.getStatus()).isEqualTo(TableStatus.AVAILABLE);
        verify(tableRepository).save(testTable);
        verify(reservationRepository).delete(res);
    }
}
