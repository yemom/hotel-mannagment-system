package com.hotelmanagement.service;

import com.hotelmanagement.model.Room;
import com.hotelmanagement.model.RoomStatus;
import com.hotelmanagement.model.RoomType;
import com.hotelmanagement.repository.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for RoomService covering room management and price band equivalence partitioning.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RoomService Unit Tests")
class RoomServiceTest {

    private RoomService roomService;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private PricingService pricingService;

    @BeforeEach
    void setUp() {
        roomService = new RoomService(roomRepository, pricingService);
    }

    // ===== Price Band Equivalence Partitioning Tests =====

    @ParameterizedTest
    @CsvSource({
        "75,SINGLE,1",      // Budget room
        "115,DOUBLE,2",     // Standard room
        "225,SUITE,4",      // Premium room
        "375,DELUXE,2",     // Luxury room
        "750,PENTHOUSE,4"   // Ultra-luxury room
    })
    @DisplayName("Should create rooms in different price bands")
    void testCreateRoomsInDifferentPriceBands(String price, String type, String capacity) {
        // Arrange
        Room room = Room.builder()
            .roomNumber("100")
            .roomType(RoomType.valueOf(type))
            .basePrice(new BigDecimal(price))
            .capacity(Integer.parseInt(capacity))
            .build();

        when(pricingService.isValidPrice(new BigDecimal(price))).thenReturn(true);
        when(roomRepository.save(any(Room.class))).thenReturn(room);

        // Act
        Room result = roomService.createRoom(room);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(RoomStatus.AVAILABLE);
        assertThat(result.getBasePrice()).isEqualByComparingTo(new BigDecimal(price));
    }

    @Test
    @DisplayName("Should reject room with invalid price (zero)")
    void testCreateRoomInvalidPriceZero() {
        // Arrange
        Room room = Room.builder()
            .roomNumber("100")
            .roomType(RoomType.SINGLE)
            .basePrice(BigDecimal.ZERO)
            .capacity(1)
            .build();

        when(pricingService.isValidPrice(BigDecimal.ZERO)).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> roomService.createRoom(room))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Should reject room with negative price")
    void testCreateRoomNegativePrice() {
        // Arrange
        Room room = Room.builder()
            .roomNumber("100")
            .roomType(RoomType.SINGLE)
            .basePrice(new BigDecimal("-50"))
            .capacity(1)
            .build();

        when(pricingService.isValidPrice(new BigDecimal("-50"))).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> roomService.createRoom(room))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Should reject room with price exceeding maximum (>10000)")
    void testCreateRoomExcessivePrice() {
        // Arrange
        Room room = Room.builder()
            .roomNumber("100")
            .roomType(RoomType.SINGLE)
            .basePrice(new BigDecimal("15000"))
            .capacity(1)
            .build();

        when(pricingService.isValidPrice(new BigDecimal("15000"))).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> roomService.createRoom(room))
            .isInstanceOf(IllegalArgumentException.class);
    }

    // ===== Room Capacity Tests (Boundary Value Analysis) =====

    @Test
    @DisplayName("Should create room with minimum capacity (1 guest)")
    void testCreateRoomMinimumCapacity() {
        // Arrange
        Room room = Room.builder()
            .roomNumber("100")
            .roomType(RoomType.SINGLE)
            .basePrice(new BigDecimal("75"))
            .capacity(1)
            .build();

        when(pricingService.isValidPrice(new BigDecimal("75"))).thenReturn(true);
        when(roomRepository.save(any(Room.class))).thenReturn(room);

        // Act
        Room result = roomService.createRoom(room);

        // Assert
        assertThat(result.getCapacity()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should create room with maximum typical capacity (4 guests)")
    void testCreateRoomMaximumCapacity() {
        // Arrange
        Room room = Room.builder()
            .roomNumber("100")
            .roomType(RoomType.PENTHOUSE)
            .basePrice(new BigDecimal("750"))
            .capacity(4)
            .build();

        when(pricingService.isValidPrice(new BigDecimal("750"))).thenReturn(true);
        when(roomRepository.save(any(Room.class))).thenReturn(room);

        // Act
        Room result = roomService.createRoom(room);

        // Assert
        assertThat(result.getCapacity()).isEqualTo(4);
    }

    @Test
    @DisplayName("Should reject room with zero capacity")
    void testCreateRoomZeroCapacity() {
        // Arrange
        Room room = Room.builder()
            .roomNumber("100")
            .roomType(RoomType.SINGLE)
            .basePrice(new BigDecimal("75"))
            .capacity(0)
            .build();

        when(pricingService.isValidPrice(new BigDecimal("75"))).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> roomService.createRoom(room))
            .isInstanceOf(IllegalArgumentException.class);
    }

    // ===== Room Status Management Tests =====

    @Test
    @DisplayName("Should update room status to MAINTENANCE")
    void testSendRoomToMaintenance() {
        // Arrange
        Room room = Room.builder()
            .id(1L)
            .roomNumber("100")
            .roomType(RoomType.DOUBLE)
            .basePrice(new BigDecimal("115"))
            .capacity(2)
            .status(RoomStatus.AVAILABLE)
            .build();

        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Room result = roomService.sendToMaintenance(1L);

        // Assert
        assertThat(result.getStatus()).isEqualTo(RoomStatus.MAINTENANCE);
        verify(roomRepository, times(1)).save(any(Room.class));
    }

    @Test
    @DisplayName("Should mark room as AVAILABLE after maintenance")
    void testMarkRoomAvailable() {
        // Arrange
        Room room = Room.builder()
            .id(1L)
            .roomNumber("100")
            .roomType(RoomType.DOUBLE)
            .basePrice(new BigDecimal("115"))
            .capacity(2)
            .status(RoomStatus.MAINTENANCE)
            .build();

        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Room result = roomService.markAsAvailable(1L);

        // Assert
        assertThat(result.getStatus()).isEqualTo(RoomStatus.AVAILABLE);
    }

    // ===== Room Query Tests =====

    @Test
    @DisplayName("Should retrieve available rooms for valid date range and guest count")
    void testGetAvailableRooms() {
        // Arrange
        List<Room> availableRooms = Arrays.asList(
            Room.builder().id(1L).roomNumber("101").capacity(2).status(RoomStatus.AVAILABLE).build(),
            Room.builder().id(2L).roomNumber("102").capacity(2).status(RoomStatus.AVAILABLE).build()
        );

        when(roomRepository.findByStatus(RoomStatus.AVAILABLE)).thenReturn(availableRooms);

        // Act
        List<Room> result = roomService.getAvailableRooms(
            LocalDate.of(2026, 9, 10),
            LocalDate.of(2026, 9, 13),
            2
        );

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result).allMatch(room -> room.getCapacity() >= 2);
    }

    @Test
    @DisplayName("Should reject invalid date range query")
    void testGetAvailableRoomsInvalidDateRange() {
        // Act & Assert
        assertThatThrownBy(() -> roomService.getAvailableRooms(
            LocalDate.of(2026, 9, 13),
            LocalDate.of(2026, 9, 10),  // Checkout before checkin
            2
        )).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid date range");
    }

    @Test
    @DisplayName("Should reject invalid guest count query")
    void testGetAvailableRoomsInvalidGuestCount() {
        // Act & Assert
        assertThatThrownBy(() -> roomService.getAvailableRooms(
            LocalDate.of(2026, 9, 10),
            LocalDate.of(2026, 9, 13),
            0  // Invalid guest count
        )).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid guest count");
    }

    @Test
    @DisplayName("Should retrieve rooms by type")
    void testGetRoomsByType() {
        // Arrange
        List<Room> suites = Arrays.asList(
            Room.builder().id(1L).roomType(RoomType.SUITE).status(RoomStatus.AVAILABLE).build(),
            Room.builder().id(2L).roomType(RoomType.SUITE).status(RoomStatus.OCCUPIED).build()
        );

        when(roomRepository.findByRoomType(RoomType.SUITE)).thenReturn(suites);

        // Act
        List<Room> result = roomService.getRoomsByType(RoomType.SUITE);

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result).allMatch(room -> room.getRoomType() == RoomType.SUITE);
    }

    @Test
    @DisplayName("Should retrieve available rooms by type")
    void testGetAvailableRoomsByType() {
        // Arrange
        List<Room> availableSuites = Arrays.asList(
            Room.builder().id(1L).roomType(RoomType.SUITE).status(RoomStatus.AVAILABLE).build()
        );

        when(roomRepository.findByRoomTypeAndStatus(RoomType.SUITE, RoomStatus.AVAILABLE))
            .thenReturn(availableSuites);

        // Act
        List<Room> result = roomService.getAvailableRoomsByType(RoomType.SUITE);

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(RoomStatus.AVAILABLE);
    }

    @Test
    @DisplayName("Should send room to maintenance and mark as available after maintenance")
    void testMaintenanceCycle() {
        Room room = Room.builder().id(1L).status(RoomStatus.AVAILABLE).build();
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(roomRepository.save(any(Room.class))).thenAnswer(i -> i.getArgument(0));

        Room maintenance = roomService.sendToMaintenance(1L);
        assertThat(maintenance.getStatus()).isEqualTo(RoomStatus.MAINTENANCE);

        Room available = roomService.markAsAvailable(1L);
        assertThat(available.getStatus()).isEqualTo(RoomStatus.AVAILABLE);
    }

    @Test
    @DisplayName("Should retrieve room by ID and number")
    void testGetRoomByIdAndNumber() {
        Room room = Room.builder().id(10L).roomNumber("101").build();
        when(roomRepository.findById(10L)).thenReturn(Optional.of(room));
        when(roomRepository.findByRoomNumber("101")).thenReturn(Optional.of(room));

        assertThat(roomService.getRoom(10L)).isPresent();
        assertThat(roomService.getRoomByNumber("101")).isPresent();
    }

    @Test
    @DisplayName("Should retrieve all rooms and rooms by status")
    void testGetAllAndByStatus() {
        Room room1 = Room.builder().id(1L).status(RoomStatus.AVAILABLE).build();
        Room room2 = Room.builder().id(2L).status(RoomStatus.OCCUPIED).build();

        when(roomRepository.findAll()).thenReturn(List.of(room1, room2));
        when(roomRepository.findByStatus(RoomStatus.AVAILABLE)).thenReturn(List.of(room1));

        assertThat(roomService.getAllRooms()).hasSize(2);
        assertThat(roomService.getRoomsByStatus(RoomStatus.AVAILABLE)).containsExactly(room1);
    }

    @Test
    @DisplayName("Should reject guest count exceeding 20")
    void testGuestCountExceeding20() {
        assertThatThrownBy(() -> roomService.getAvailableRooms(
            LocalDate.of(2026, 9, 10),
            LocalDate.of(2026, 9, 13),
            21
        )).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid guest count");
    }

    @Test
    @DisplayName("Should reject null dates in date range")
    void testNullDates() {
        assertThatThrownBy(() -> roomService.getAvailableRooms(
            null,
            LocalDate.of(2026, 9, 13),
            2
        )).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid date range");
    }
}
