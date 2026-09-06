package com.hotelmanagement.service;

import com.hotelmanagement.model.*;
import com.hotelmanagement.repository.GuestRepository;
import com.hotelmanagement.repository.ReservationRepository;
import com.hotelmanagement.repository.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests that test multiple components working together.
 * Tests full workflow from guest registration to reservation checkout.
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Hotel Management System Integration Tests")
class HotelManagementIntegrationTest {

    @Autowired
    private GuestService guestService;

    @Autowired
    private RoomService roomService;

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private GuestRepository guestRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @BeforeEach
    void setUp() {
        // Clear all data before each test
        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        guestRepository.deleteAll();
    }

    // ===== End-to-End Workflow Tests =====

    @Test
    @DisplayName("Integration: Complete reservation workflow from registration to checkout")
    void testCompleteReservationWorkflow() {
        // Step 1: Register a guest
        Guest guest = Guest.builder()
            .firstName("John")
            .lastName("Doe")
            .email("john@example.com")
            .password("password123")
            .phone("1234567890")
            .age(30)
            .build();

        Guest registeredGuest = guestService.registerGuest(guest);
        assertThat(registeredGuest.getId()).isNotNull();
        assertThat(registeredGuest.getStatus()).isEqualTo(GuestStatus.ACTIVE);

        // Step 2: Create a room
        Room room = Room.builder()
            .roomNumber("101")
            .roomType(RoomType.DOUBLE)
            .basePrice(new BigDecimal("100"))
            .capacity(2)
            .hasBathtub(true)
            .hasBalcony(false)
            .hasMinibar(true)
            .build();

        Room createdRoom = roomService.createRoom(room);
        assertThat(createdRoom.getStatus()).isEqualTo(RoomStatus.AVAILABLE);

        // Step 3: Create a reservation
        Reservation reservation = Reservation.builder()
            .guest(registeredGuest)
            .room(createdRoom)
            .checkInDate(LocalDate.now())
            .checkOutDate(LocalDate.now().plusDays(3))
            .numberOfGuests(2)
            .specialRequests("High floor preferred")
            .build();

        Reservation createdReservation = reservationService.createReservation(reservation);
        assertThat(createdReservation.getId()).isNotNull();
        assertThat(createdReservation.getStatus()).isEqualTo(ReservationStatus.PENDING);
        assertThat(createdReservation.getTotalPrice()).isGreaterThan(BigDecimal.ZERO);

        // Step 4: Confirm reservation
        Reservation confirmedReservation = reservationService.confirmReservation(createdReservation.getId());
        assertThat(confirmedReservation.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);

        // Step 5: Check in
        Reservation checkedInReservation = reservationService.checkIn(confirmedReservation.getId());
        assertThat(checkedInReservation.getStatus()).isEqualTo(ReservationStatus.CHECKED_IN);

        // Verify room is now occupied
        Room occupiedRoom = roomService.getRoom(createdRoom.getId()).orElseThrow();
        assertThat(occupiedRoom.getStatus()).isEqualTo(RoomStatus.OCCUPIED);

        // Step 6: Check out
        Reservation checkedOutReservation = reservationService.checkOut(checkedInReservation.getId());
        assertThat(checkedOutReservation.getStatus()).isEqualTo(ReservationStatus.CHECKED_OUT);

        // Verify room is available again
        Room availableRoom = roomService.getRoom(createdRoom.getId()).orElseThrow();
        assertThat(availableRoom.getStatus()).isEqualTo(RoomStatus.AVAILABLE);
    }

    // ===== Guest and Reservation Integration Tests =====

    @Test
    @DisplayName("Integration: Guest cannot make reservation with suspended account")
    void testSuspendedGuestCannotReserve() {
        // Step 1: Register guest
        Guest guest = Guest.builder()
            .firstName("Jane")
            .lastName("Smith")
            .email("jane@example.com")
            .password("password123")
            .phone("1234567890")
            .age(28)
            .build();

        Guest registeredGuest = guestService.registerGuest(guest);

        // Step 2: Create room
        Room room = Room.builder()
            .roomNumber("202")
            .roomType(RoomType.SINGLE)
            .basePrice(new BigDecimal("75"))
            .capacity(1)
            .build();

        Room createdRoom = roomService.createRoom(room);

        // Step 3: Suspend guest
        guestService.suspendGuest(registeredGuest.getId());

        // Step 4: Try to make reservation - should fail with proper validation
        Reservation reservation = Reservation.builder()
            .guest(registeredGuest)
            .room(createdRoom)
            .checkInDate(LocalDate.now())
            .checkOutDate(LocalDate.now().plusDays(2))
            .numberOfGuests(1)
            .build();

        // The guest object won't reflect suspension unless we reload it
        Guest suspendedGuest = guestService.getGuest(registeredGuest.getId()).orElseThrow();
        assertThat(suspendedGuest.canMakeReservation()).isFalse();
    }

    // ===== Room Availability Integration Tests =====

    @Test
    @DisplayName("Integration: Room becomes unavailable when reserved and available after checkout")
    void testRoomAvailabilityAfterReservationCycle() {
        // Step 1: Create room
        Room room = Room.builder()
            .roomNumber("303")
            .roomType(RoomType.DOUBLE)
            .basePrice(new BigDecimal("115"))
            .capacity(2)
            .build();

        Room createdRoom = roomService.createRoom(room);
        assertThat(createdRoom.getStatus()).isEqualTo(RoomStatus.AVAILABLE);

        // Step 2: Register guest
        Guest guest = Guest.builder()
            .firstName("Bob")
            .lastName("Johnson")
            .email("bob@example.com")
            .password("password123")
            .phone("1234567890")
            .age(45)
            .build();

        Guest registeredGuest = guestService.registerGuest(guest);

        // Step 3: Create and confirm reservation
        Reservation reservation = Reservation.builder()
            .guest(registeredGuest)
            .room(createdRoom)
            .checkInDate(LocalDate.now())
            .checkOutDate(LocalDate.now().plusDays(2))
            .numberOfGuests(2)
            .build();

        Reservation createdReservation = reservationService.createReservation(reservation);
        Reservation confirmedReservation = reservationService.confirmReservation(createdReservation.getId());

        // Step 4: Check in
        reservationService.checkIn(confirmedReservation.getId());

        // Verify room is occupied
        Room occupiedRoom = roomService.getRoom(createdRoom.getId()).orElseThrow();
        assertThat(occupiedRoom.isOccupied()).isTrue();

        // Step 5: Check out
        reservationService.checkOut(confirmedReservation.getId());

        // Verify room is available again
        Room finalRoom = roomService.getRoom(createdRoom.getId()).orElseThrow();
        assertThat(finalRoom.getStatus()).isEqualTo(RoomStatus.AVAILABLE);
    }

    // ===== Discount and Pricing Integration Tests =====

    @Test
    @DisplayName("Integration: Senior VIP guest receives maximum discount")
    void testSeniorVipMaximumDiscount() {
        // Create senior VIP guest
        Guest guest = Guest.builder()
            .firstName("Senior")
            .lastName("VIP")
            .email("senior@vip.com")
            .password("password123")
            .phone("1234567890")
            .age(65)
            .build();

        Guest registeredGuest = guestService.registerGuest(guest);

        // Create room
        Room room = Room.builder()
            .roomNumber("404")
            .roomType(RoomType.SUITE)
            .basePrice(new BigDecimal("100"))
            .capacity(2)
            .build();

        Room createdRoom = roomService.createRoom(room);

        // Create long-stay reservation in off-peak season
        Reservation reservation = Reservation.builder()
            .guest(registeredGuest)
            .room(createdRoom)
            .checkInDate(LocalDate.of(2026, 9, 5))   // Off-peak
            .checkOutDate(LocalDate.of(2026, 9, 8))  // 3 nights
            .numberOfGuests(2)
            .build();

        Reservation createdReservation = reservationService.createReservation(reservation);

        // Calculate discount
        BigDecimal baseTotal = new BigDecimal("100").multiply(new BigDecimal("3")); // 300
        BigDecimal discount = createdReservation.getDiscountAmount();
        BigDecimal expectedMaxDiscount = baseTotal.multiply(new BigDecimal("0.25")); // 25%

        assertThat(discount).isEqualByComparingTo(expectedMaxDiscount);
    }

    @Test
    @DisplayName("Integration: Young regular guest gets no discount for short peak season stay")
    void testNoDiscountShortPeakSeason() {
        // Create young regular guest
        Guest guest = Guest.builder()
            .firstName("Young")
            .lastName("Regular")
            .email("young@regular.com")
            .password("password123")
            .phone("1234567890")
            .age(25)
            .build();

        Guest registeredGuest = guestService.registerGuest(guest);

        // Create room
        Room room = Room.builder()
            .roomNumber("505")
            .roomType(RoomType.SINGLE)
            .basePrice(new BigDecimal("100"))
            .capacity(1)
            .build();

        Room createdRoom = roomService.createRoom(room);

        // Create short-stay reservation in peak season
        Reservation reservation = Reservation.builder()
            .guest(registeredGuest)
            .room(createdRoom)
            .checkInDate(LocalDate.of(2026, 7, 1))   // Peak season (July)
            .checkOutDate(LocalDate.of(2026, 7, 2))  // 1 night
            .numberOfGuests(1)
            .build();

        Reservation createdReservation = reservationService.createReservation(reservation);

        // Verify no discount
        assertThat(createdReservation.getDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    // ===== Multiple Reservations Integration Tests =====

    @Test
    @DisplayName("Integration: Retrieve all reservations for a guest")
    void testGetGuestReservations() {
        // Create guest
        Guest guest = Guest.builder()
            .firstName("Active")
            .lastName("Guest")
            .email("active@example.com")
            .password("password123")
            .phone("1234567890")
            .age(35)
            .build();

        Guest registeredGuest = guestService.registerGuest(guest);

        // Create multiple rooms
        Room room1 = roomService.createRoom(Room.builder()
            .roomNumber("601")
            .roomType(RoomType.SINGLE)
            .basePrice(new BigDecimal("75"))
            .capacity(1)
            .build());

        Room room2 = roomService.createRoom(Room.builder()
            .roomNumber("602")
            .roomType(RoomType.DOUBLE)
            .basePrice(new BigDecimal("115"))
            .capacity(2)
            .build());

        // Create multiple reservations
        Reservation res1 = reservationService.createReservation(Reservation.builder()
            .guest(registeredGuest)
            .room(room1)
            .checkInDate(LocalDate.of(2026, 9, 10))
            .checkOutDate(LocalDate.of(2026, 9, 12))
            .numberOfGuests(1)
            .build());

        Reservation res2 = reservationService.createReservation(Reservation.builder()
            .guest(registeredGuest)
            .room(room2)
            .checkInDate(LocalDate.of(2026, 10, 1))
            .checkOutDate(LocalDate.of(2026, 10, 5))
            .numberOfGuests(2)
            .build());

        // Retrieve guest reservations
        List<Reservation> guestReservations = reservationService.getReservationsByGuest(registeredGuest.getId());

        assertThat(guestReservations).hasSize(2);
        assertThat(guestReservations).extracting(Reservation::getId)
            .containsExactlyInAnyOrder(res1.getId(), res2.getId());
    }

    // ===== Room Maintenance Integration Tests =====

    @Test
    @DisplayName("Integration: Room in maintenance cannot be reserved")
    void testMaintenanceRoomNotAvailable() {
        // Create room and send to maintenance
        Room room = roomService.createRoom(Room.builder()
            .roomNumber("701")
            .roomType(RoomType.DOUBLE)
            .basePrice(new BigDecimal("100"))
            .capacity(2)
            .build());

        roomService.sendToMaintenance(room.getId());

        // Try to get available rooms - maintenance room should not be in the list
        List<Room> availableRooms = roomService.getAvailableRooms(
            LocalDate.now(),
            LocalDate.now().plusDays(2),
            2
        );

        assertThat(availableRooms)
            .noneMatch(r -> r.getId().equals(room.getId()));
    }
}
