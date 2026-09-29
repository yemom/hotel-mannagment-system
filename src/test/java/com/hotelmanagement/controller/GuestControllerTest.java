package com.hotelmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelmanagement.model.Guest;
import com.hotelmanagement.model.GuestStatus;
import com.hotelmanagement.service.GuestService;
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

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("GuestController HTTP Tests")
class GuestControllerTest {

    private MockMvc mockMvc;

    @Mock
    private GuestService guestService;

    @InjectMocks
    private GuestController guestController;

    private ObjectMapper objectMapper;
    private Guest sampleGuest;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(guestController).build();
        objectMapper = new ObjectMapper();

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
    }

    @Test
    @DisplayName("POST /api/guests/register - 201 CREATED for valid guest")
    void testRegisterGuestSuccess() throws Exception {
        when(guestService.registerGuest(any(Guest.class))).thenReturn(sampleGuest);

        mockMvc.perform(post("/api/guests/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleGuest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("john@example.com"));
    }

    @Test
    @DisplayName("POST /api/guests/register - 400 BAD REQUEST when registration fails")
    void testRegisterGuestBadRequest() throws Exception {
        when(guestService.registerGuest(any(Guest.class)))
                .thenThrow(new IllegalArgumentException("Invalid age"));

        mockMvc.perform(post("/api/guests/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleGuest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/guests/login - 200 OK on successful authentication")
    void testLoginSuccess() throws Exception {
        when(guestService.authenticate("john@example.com", "password123")).thenReturn(sampleGuest);

        mockMvc.perform(post("/api/guests/login")
                        .param("email", "john@example.com")
                        .param("password", "password123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("POST /api/guests/login - 401 UNAUTHORIZED on failed authentication")
    void testLoginUnauthorized() throws Exception {
        when(guestService.authenticate("john@example.com", "wrong"))
                .thenThrow(new IllegalArgumentException("Invalid credentials"));

        mockMvc.perform(post("/api/guests/login")
                        .param("email", "john@example.com")
                        .param("password", "wrong"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/guests/{id} - 200 OK when found")
    void testGetGuestFound() throws Exception {
        when(guestService.getGuest(1L)).thenReturn(Optional.of(sampleGuest));

        mockMvc.perform(get("/api/guests/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("john@example.com"));
    }

    @Test
    @DisplayName("GET /api/guests/{id} - 404 NOT FOUND when not found")
    void testGetGuestNotFound() throws Exception {
        when(guestService.getGuest(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/guests/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/guests/email/{email} - 200 OK when found")
    void testGetGuestByEmail() throws Exception {
        when(guestService.getGuestByEmail("john@example.com")).thenReturn(Optional.of(sampleGuest));

        mockMvc.perform(get("/api/guests/email/john@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("GET /api/guests - 200 OK returns all guests")
    void testGetAllGuests() throws Exception {
        when(guestService.getAllGuests()).thenReturn(List.of(sampleGuest));

        mockMvc.perform(get("/api/guests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @DisplayName("GET /api/guests/active/list - 200 OK returns active guests")
    void testGetActiveGuests() throws Exception {
        when(guestService.getAllActiveGuests()).thenReturn(List.of(sampleGuest));

        mockMvc.perform(get("/api/guests/active/list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    @DisplayName("POST /api/guests/{id}/suspend - 200 OK when suspended")
    void testSuspendGuest() throws Exception {
        sampleGuest.setStatus(GuestStatus.SUSPENDED);
        when(guestService.suspendGuest(1L)).thenReturn(sampleGuest);

        mockMvc.perform(post("/api/guests/1/suspend"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));
    }

    @Test
    @DisplayName("POST /api/guests/{id}/reactivate - 200 OK when reactivated")
    void testReactivateGuest() throws Exception {
        sampleGuest.setStatus(GuestStatus.ACTIVE);
        when(guestService.reactivateGuest(1L)).thenReturn(sampleGuest);

        mockMvc.perform(post("/api/guests/1/reactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("POST /api/guests/{id}/change-password - 200 OK on change")
    void testChangePassword() throws Exception {
        when(guestService.changePassword(eq(1L), eq("oldPass"), eq("newPass123"))).thenReturn(sampleGuest);

        mockMvc.perform(post("/api/guests/1/change-password")
                        .param("currentPassword", "oldPass")
                        .param("newPassword", "newPass123"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/guests/{id} - 204 NO CONTENT on deletion")
    void testDeleteGuest() throws Exception {
        doNothing().when(guestService).deleteGuest(1L);

        mockMvc.perform(delete("/api/guests/1"))
                .andExpect(status().isNoContent());
    }
}
