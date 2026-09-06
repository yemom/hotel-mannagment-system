package com.hotelmanagement.service;

import com.hotelmanagement.model.RestaurantTable;
import com.hotelmanagement.model.TableReservation;
import com.hotelmanagement.model.TableReservationStatus;
import com.hotelmanagement.model.TableStatus;
import com.hotelmanagement.repository.RestaurantTableRepository;
import com.hotelmanagement.repository.TableReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
@DisplayName("RestaurantTableService Unit Tests with Test Doubles")
class RestaurantTableServiceTest {

    @Mock
    private RestaurantTableRepository tableRepository;

    @Mock
    private TableReservationRepository reservationRepository;

    @InjectMocks
    private RestaurantTableService service;

    private RestaurantTable table1;
    private RestaurantTable table2;
    private RestaurantTable cleaningTable;

    @BeforeEach
    void setUp() {
        table1 = RestaurantTable.builder()
                .id(1L)
                .tableNumber("T-01")
                .capacity(2)
                .status(TableStatus.AVAILABLE)
                .build();

        table2 = RestaurantTable.builder()
                .id(2L)
                .tableNumber("T-02")
                .capacity(4)
                .status(TableStatus.AVAILABLE)
                .build();

        cleaningTable = RestaurantTable.builder()
                .id(3L)
                .tableNumber("T-03")
                .capacity(6)
                .status(TableStatus.CLEANING)
                .build();
    }

    @Test
    @DisplayName("Should return all tables from repository")
    void testGetAllTables() {
        when(tableRepository.findAll()).thenReturn(List.of(table1, table2));
        List<RestaurantTable> all = service.getAll();
        assertThat(all).hasSize(2);
    }

    @Test
    @DisplayName("Should return table by ID if exists")
    void testGetByIdFound() {
        when(tableRepository.findById(1L)).thenReturn(Optional.of(table1));
        RestaurantTable table = service.getById(1L);
        assertThat(table.getTableNumber()).isEqualTo("T-01");
    }

    @Test
    @DisplayName("Should throw exception when table ID not found")
    void testGetByIdNotFound() {
        when(tableRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Table not found");
    }

    @Test
    @DisplayName("Should filter available tables based on capacity, time slot, and cleaning status")
    void testGetAvailableTables() {
        LocalDate date = LocalDate.now();
        String timeSlot = "19:00 - 21:00";

        // Table 1 is already booked in this slot
        TableReservation bookedRes = TableReservation.builder()
                .reservationDate(date)
                .timeSlot(timeSlot)
                .status(TableReservationStatus.CONFIRMED)
                .restaurantTable(table1)
                .build();

        when(reservationRepository.findByReservationDate(date)).thenReturn(List.of(bookedRes));
        when(tableRepository.findAll()).thenReturn(List.of(table1, table2, cleaningTable));

        // Looking for party size 3:
        // - table 1 is booked for this slot (filtered out)
        // - table 2 has capacity 4 >= 3 and is AVAILABLE (kept)
        // - cleaningTable has status CLEANING (filtered out)
        List<RestaurantTable> available = service.getAvailable(date, timeSlot, 3);

        assertThat(available).containsExactly(table2);
    }

    @Test
    @DisplayName("Should update table status")
    void testUpdateStatus() {
        when(tableRepository.findById(1L)).thenReturn(Optional.of(table1));
        when(tableRepository.save(any(RestaurantTable.class))).thenAnswer(i -> i.getArgument(0));

        RestaurantTable updated = service.updateStatus(1L, "OCCUPIED");
        assertThat(updated.getStatus()).isEqualTo(TableStatus.OCCUPIED);
    }

    @Test
    @DisplayName("Should create table with default AVAILABLE status if null")
    void testCreateTable() {
        RestaurantTable newTable = RestaurantTable.builder()
                .tableNumber("T-04")
                .capacity(4)
                .build();

        when(tableRepository.save(any(RestaurantTable.class))).thenAnswer(i -> i.getArgument(0));

        RestaurantTable created = service.createTable(newTable);
        assertThat(created.getStatus()).isEqualTo(TableStatus.AVAILABLE);
    }

    @Test
    @DisplayName("Should delete table by ID")
    void testDeleteTable() {
        service.deleteTable(1L);
        verify(tableRepository).deleteById(1L);
    }
}
