package com.hotelmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelmanagement.model.DiningArea;
import com.hotelmanagement.model.RestaurantTable;
import com.hotelmanagement.model.TableStatus;
import com.hotelmanagement.service.RestaurantTableService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("RestaurantTableController HTTP Tests")
class RestaurantTableControllerTest {

    private MockMvc mockMvc;

    @Mock
    private RestaurantTableService tableService;

    @InjectMocks
    private RestaurantTableController restaurantTableController;

    private ObjectMapper objectMapper;
    private RestaurantTable sampleTable;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(restaurantTableController).build();
        objectMapper = new ObjectMapper();

        sampleTable = RestaurantTable.builder()
                .id(1L)
                .tableNumber("MH-01")
                .capacity(4)
                .area(DiningArea.MAIN_HALL)
                .status(TableStatus.AVAILABLE)
                .build();
    }

    @Test
    @DisplayName("GET /api/restaurant/tables - 200 OK returns all tables")
    void testGetAllTables() throws Exception {
        when(tableService.getAll()).thenReturn(List.of(sampleTable));

        mockMvc.perform(get("/api/restaurant/tables"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tableNumber").value("MH-01"));
    }

    @Test
    @DisplayName("GET /api/restaurant/tables/{id} - 200 OK when found")
    void testGetTableByIdFound() throws Exception {
        when(tableService.getById(1L)).thenReturn(sampleTable);

        mockMvc.perform(get("/api/restaurant/tables/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("POST /api/restaurant/tables - 201 CREATED for valid table")
    void testCreateTable() throws Exception {
        when(tableService.createTable(any(RestaurantTable.class))).thenReturn(sampleTable);

        mockMvc.perform(post("/api/restaurant/tables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleTable)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tableNumber").value("MH-01"));
    }

    @Test
    @DisplayName("PUT /api/restaurant/tables/{id}/status - 200 OK updates status")
    void testUpdateStatus() throws Exception {
        sampleTable.setStatus(TableStatus.OCCUPIED);
        when(tableService.updateStatus(eq(1L), eq("OCCUPIED"))).thenReturn(sampleTable);

        mockMvc.perform(put("/api/restaurant/tables/1/status")
                        .param("status", "OCCUPIED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OCCUPIED"));
    }

    @Test
    @DisplayName("DELETE /api/restaurant/tables/{id} - 204 NO CONTENT on deletion")
    void testDeleteTable() throws Exception {
        doNothing().when(tableService).deleteTable(1L);

        mockMvc.perform(delete("/api/restaurant/tables/1"))
                .andExpect(status().isNoContent());
    }
}
