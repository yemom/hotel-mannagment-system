package com.hotelmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelmanagement.model.Guest;
import com.hotelmanagement.model.Reservation;
import com.hotelmanagement.model.ReservationStatus;
import com.hotelmanagement.model.Room;
import com.hotelmanagement.repository.GuestRepository;
import com.hotelmanagement.repository.RoomRepository;
import com.hotelmanagement.service.ReservationService;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReservationController HTTP Tests")
class ReservationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ReservationService reservationService;

    @Mock
    private GuestRepository guestRepository;

    @Mock
    private RoomRepository roomRepository;

    @InjectMocks
    private ReservationController reservationController;

    private Reservation sampleReservation;
    private Guest sampleGuest;
    private Room sampleRoom;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reservationController).build();

        sampleGuest = Guest.builder().id(1L).firstName("John").lastName("Doe").build();
        sampleRoom = Room.builder().id(1L).roomNumber("101").build();

        sampleReservation = Reservation.builder()
                .id(1L)
                .guest(sampleGuest)
                .room(sampleRoom)
                .checkInDate(LocalDate.now().plusDays(1))
                .checkOutDate(LocalDate.now().plusDays(3))
                .numberOfGuests(2)
                .totalPrice(new BigDecimal("200.00"))
                .discountAmount(BigDecimal.ZERO)
                .status(ReservationStatus.PENDING)
                .build();
    }

    @Test
    @DisplayName("POST /api/reservations - 201 CREATED for valid reservation")
    void testCreateReservationSuccess() throws Exception {
        when(guestRepository.findById(1L)).thenReturn(Optional.of(sampleGuest));
        when(roomRepository.findById(1L)).thenReturn(Optional.of(sampleRoom));
        when(reservationService.createReservation(any(Reservation.class))).thenReturn(sampleReservation);

        String json = "{\"guestId\":1,\"roomId\":1,\"checkInDate\":\"2026-10-01\",\"checkOutDate\":\"2026-10-04\",\"numberOfGuests\":2}";

        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("GET /api/reservations/{id} - 200 OK when found")
    void testGetReservationByIdFound() throws Exception {
        when(reservationService.getReservation(1L)).thenReturn(Optional.of(sampleReservation));

        mockMvc.perform(get("/api/reservations/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("GET /api/reservations/{id} - 404 NOT FOUND when not found")
    void testGetReservationByIdNotFound() throws Exception {
        when(reservationService.getReservation(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/reservations/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/reservations - 200 OK returns all reservations")
    void testGetAllReservations() throws Exception {
        when(reservationService.getAllReservations()).thenReturn(List.of(sampleReservation));

        mockMvc.perform(get("/api/reservations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @DisplayName("POST /api/reservations/{id}/confirm - 200 OK confirms reservation")
    void testConfirmReservation() throws Exception {
        sampleReservation.setStatus(ReservationStatus.CONFIRMED);
        when(reservationService.confirmReservation(1L)).thenReturn(sampleReservation);

        mockMvc.perform(post("/api/reservations/1/confirm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("POST /api/reservations/{id}/cancel - 200 OK cancels reservation")
    void testCancelReservation() throws Exception {
        sampleReservation.setStatus(ReservationStatus.CANCELLED);
        when(reservationService.cancelReservation(1L)).thenReturn(sampleReservation);

        mockMvc.perform(post("/api/reservations/1/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }
}
