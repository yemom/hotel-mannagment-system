package com.hotelmanagement.controller;

import com.hotelmanagement.model.DiningArea;
import com.hotelmanagement.model.Guest;
import com.hotelmanagement.model.RestaurantTable;
import com.hotelmanagement.model.TableReservation;
import com.hotelmanagement.model.TableReservationStatus;
import com.hotelmanagement.model.TableStatus;
import com.hotelmanagement.service.TableReservationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("TableReservationController HTTP Tests")
class TableReservationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TableReservationService tableReservationService;

    @InjectMocks
    private TableReservationController tableReservationController;

    private TableReservation sampleReservation;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(tableReservationController).build();

        Guest guest = Guest.builder().id(1L).firstName("John").lastName("Doe").build();
        RestaurantTable table = RestaurantTable.builder().id(1L).tableNumber("MH-01").capacity(4).area(DiningArea.MAIN_HALL).status(TableStatus.AVAILABLE).build();

        sampleReservation = TableReservation.builder()
                .id(1L)
                .guest(guest)
                .restaurantTable(table)
                .reservationDate(LocalDate.now().plusDays(1))
                .timeSlot("19:00")
                .partySize(2)
                .status(TableReservationStatus.PENDING)
                .build();
    }

    @Test
    @DisplayName("POST /api/restaurant/reservations - 201 CREATED for valid table reservation")
    void testCreateReservation() throws Exception {
        when(tableReservationService.create(any(TableReservation.class))).thenReturn(sampleReservation);

        String json = "{\"reservationDate\":\"2026-10-01\",\"timeSlot\":\"19:00\",\"partySize\":2,\"guest\":{\"id\":1}}";

        mockMvc.perform(post("/api/restaurant/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.timeSlot").value("19:00"));
    }

    @Test
    @DisplayName("GET /api/restaurant/reservations - 200 OK returns all reservations")
    void testGetAllReservations() throws Exception {
        when(tableReservationService.getAll()).thenReturn(List.of(sampleReservation));

        mockMvc.perform(get("/api/restaurant/reservations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @DisplayName("GET /api/restaurant/reservations/{id} - 200 OK when found")
    void testGetReservationById() throws Exception {
        when(tableReservationService.getById(1L)).thenReturn(sampleReservation);

        mockMvc.perform(get("/api/restaurant/reservations/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("POST /api/restaurant/reservations/{id}/confirm - 200 OK confirms reservation")
    void testConfirmReservation() throws Exception {
        sampleReservation.setStatus(TableReservationStatus.CONFIRMED);
        when(tableReservationService.confirm(1L)).thenReturn(sampleReservation);

        mockMvc.perform(post("/api/restaurant/reservations/1/confirm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("POST /api/restaurant/reservations/{id}/cancel - 200 OK cancels reservation")
    void testCancelReservation() throws Exception {
        sampleReservation.setStatus(TableReservationStatus.CANCELLED);
        when(tableReservationService.cancel(1L)).thenReturn(sampleReservation);

        mockMvc.perform(post("/api/restaurant/reservations/1/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }
}
