package com.hotelmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hotelmanagement.model.*;
import com.hotelmanagement.service.SpaBookingService;
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
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SpaBookingController HTTP Status & Error Handling Tests")
class SpaBookingControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SpaBookingService spaBookingService;

    @InjectMocks
    private SpaBookingController spaBookingController;

    private SpaBooking sampleBooking;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(spaBookingController).build();

        Guest guest = Guest.builder().id(1L).firstName("John").lastName("Doe").build();
        SpaService service = SpaService.builder().id(10L).name("Swedish Massage").price(new BigDecimal("100.00")).build();

        sampleBooking = SpaBooking.builder()
                .id(100L)
                .guest(guest)
                .spaService(service)
                .bookingDate(LocalDate.now().plusDays(2))
                .startTime("14:00")
                .numberOfGuests(2)
                .status(SpaBookingStatus.PENDING)
                .totalPrice(new BigDecimal("200.00"))
                .duration(60)
                .build();
    }

    @Test
    @DisplayName("POST /api/spa-bookings - 201 CREATED for valid booking")
    void testCreateBookingSuccess() throws Exception {
        when(spaBookingService.createBooking(any(SpaBooking.class))).thenReturn(sampleBooking);

        String json = "{\"guestId\":1,\"spaServiceId\":10,\"bookingDate\":\"2026-10-01\",\"startTime\":\"14:00\",\"numberOfGuests\":2}";

        mockMvc.perform(post("/api/spa-bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.totalPrice").value(200.00));
    }

    @Test
    @DisplayName("POST /api/spa-bookings - 400 BAD REQUEST for validation errors")
    void testCreateBookingBadRequest() throws Exception {
        when(spaBookingService.createBooking(any(SpaBooking.class)))
                .thenThrow(new IllegalArgumentException("Cannot book spa treatment in the past"));

        String json = "{\"guestId\":1,\"spaServiceId\":10,\"bookingDate\":\"2020-01-01\",\"startTime\":\"14:00\",\"numberOfGuests\":1}";

        mockMvc.perform(post("/api/spa-bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot book spa treatment in the past"));
    }

    @Test
    @DisplayName("POST /api/spa-bookings - 409 CONFLICT on capacity conflict")
    void testCreateBookingConflict() throws Exception {
        when(spaBookingService.createBooking(any(SpaBooking.class)))
                .thenThrow(new IllegalStateException("Capacity conflict: This time slot only has 0 spot(s) remaining"));

        String json = "{\"guestId\":1,\"spaServiceId\":10,\"bookingDate\":\"2026-10-01\",\"startTime\":\"14:00\",\"numberOfGuests\":2}";

        mockMvc.perform(post("/api/spa-bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Capacity conflict: This time slot only has 0 spot(s) remaining"));
    }

    @Test
    @DisplayName("GET /api/spa-bookings/{id} - 200 OK when found")
    void testGetBookingByIdFound() throws Exception {
        when(spaBookingService.getBookingById(100L)).thenReturn(Optional.of(sampleBooking));

        mockMvc.perform(get("/api/spa-bookings/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("GET /api/spa-bookings/{id} - 404 NOT FOUND when missing")
    void testGetBookingByIdNotFound() throws Exception {
        when(spaBookingService.getBookingById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/spa-bookings/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/spa-bookings/guest/{guestId} - 200 OK returns guest bookings")
    void testGetBookingsByGuest() throws Exception {
        when(spaBookingService.getBookingsByGuest(1L)).thenReturn(List.of(sampleBooking));

        mockMvc.perform(get("/api/spa-bookings/guest/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(100));
    }

    @Test
    @DisplayName("POST /api/spa-bookings/{id}/confirm - 200 OK on successful confirmation")
    void testConfirmBookingSuccess() throws Exception {
        sampleBooking.setStatus(SpaBookingStatus.CONFIRMED);
        when(spaBookingService.confirmBooking(100L)).thenReturn(sampleBooking);

        mockMvc.perform(post("/api/spa-bookings/100/confirm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("POST /api/spa-bookings/{id}/cancel - 200 OK on successful cancellation")
    void testCancelBookingSuccess() throws Exception {
        sampleBooking.setStatus(SpaBookingStatus.CANCELLED);
        when(spaBookingService.cancelBooking(100L)).thenReturn(sampleBooking);

        mockMvc.perform(post("/api/spa-bookings/100/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("POST /api/spa-bookings/{id}/cancel - 400 BAD REQUEST on invalid state transition")
    void testCancelBookingInvalidTransition() throws Exception {
        when(spaBookingService.cancelBooking(100L))
                .thenThrow(new IllegalStateException("Cannot cancel spa booking with status: COMPLETED"));

        mockMvc.perform(post("/api/spa-bookings/100/cancel"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot cancel spa booking with status: COMPLETED"));
    }
}
