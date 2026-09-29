package com.hotelmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelmanagement.model.Room;
import com.hotelmanagement.model.RoomStatus;
import com.hotelmanagement.model.RoomType;
import com.hotelmanagement.service.RoomService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("RoomController HTTP Tests")
class RoomControllerTest {

    private MockMvc mockMvc;

    @Mock
    private RoomService roomService;

    @InjectMocks
    private RoomController roomController;

    private ObjectMapper objectMapper;
    private Room sampleRoom;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(roomController).build();
        objectMapper = new ObjectMapper();

        sampleRoom = Room.builder()
                .id(1L)
                .roomNumber("101")
                .roomType(RoomType.DOUBLE)
                .basePrice(new BigDecimal("120.00"))
                .capacity(2)
                .status(RoomStatus.AVAILABLE)
                .build();
    }

    @Test
    @DisplayName("POST /api/rooms - 201 CREATED for valid room")
    void testCreateRoom() throws Exception {
        when(roomService.createRoom(any(Room.class))).thenReturn(sampleRoom);

        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRoom)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.roomNumber").value("101"));
    }

    @Test
    @DisplayName("GET /api/rooms/{id} - 200 OK when found")
    void testGetRoomByIdFound() throws Exception {
        when(roomService.getRoom(1L)).thenReturn(Optional.of(sampleRoom));

        mockMvc.perform(get("/api/rooms/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomNumber").value("101"));
    }

    @Test
    @DisplayName("GET /api/rooms/{id} - 404 NOT FOUND when not found")
    void testGetRoomByIdNotFound() throws Exception {
        when(roomService.getRoom(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/rooms/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/rooms - 200 OK returns all rooms")
    void testGetAllRooms() throws Exception {
        when(roomService.getAllRooms()).thenReturn(List.of(sampleRoom));

        mockMvc.perform(get("/api/rooms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].roomNumber").value("101"));
    }

    @Test
    @DisplayName("GET /api/rooms/type/{type} - 200 OK returns rooms by type")
    void testGetRoomsByType() throws Exception {
        when(roomService.getRoomsByType(RoomType.DOUBLE)).thenReturn(List.of(sampleRoom));

        mockMvc.perform(get("/api/rooms/type/DOUBLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].roomType").value("DOUBLE"));
    }

    @Test
    @DisplayName("GET /api/rooms/available - 200 OK returns available rooms")
    void testGetAvailableRooms() throws Exception {
        LocalDate checkIn = LocalDate.now().plusDays(1);
        LocalDate checkOut = LocalDate.now().plusDays(3);

        when(roomService.getAvailableRooms(eq(checkIn), eq(checkOut), eq(2)))
                .thenReturn(List.of(sampleRoom));

        mockMvc.perform(get("/api/rooms/available")
                        .param("checkIn", checkIn.toString())
                        .param("checkOut", checkOut.toString())
                        .param("guests", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].roomNumber").value("101"));
    }

    @Test
    @DisplayName("PUT /api/rooms/{id}/status - 200 OK updates status")
    void testUpdateRoomStatus() throws Exception {
        sampleRoom.setStatus(RoomStatus.MAINTENANCE);
        when(roomService.updateRoomStatus(1L, RoomStatus.MAINTENANCE)).thenReturn(sampleRoom);

        mockMvc.perform(put("/api/rooms/1/status")
                        .param("status", "MAINTENANCE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MAINTENANCE"));
    }

    @Test
    @DisplayName("POST /api/rooms/{id}/maintenance - 200 OK marks maintenance")
    void testSendToMaintenance() throws Exception {
        sampleRoom.setStatus(RoomStatus.MAINTENANCE);
        when(roomService.sendToMaintenance(1L)).thenReturn(sampleRoom);

        mockMvc.perform(post("/api/rooms/1/maintenance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MAINTENANCE"));
    }

    @Test
    @DisplayName("POST /api/rooms/{id}/available - 200 OK marks available")
    void testMarkAsAvailable() throws Exception {
        sampleRoom.setStatus(RoomStatus.AVAILABLE);
        when(roomService.markAsAvailable(1L)).thenReturn(sampleRoom);

        mockMvc.perform(post("/api/rooms/1/available"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AVAILABLE"));
    }
}
