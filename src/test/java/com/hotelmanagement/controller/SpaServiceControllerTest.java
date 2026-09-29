package com.hotelmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelmanagement.model.SpaCategory;
import com.hotelmanagement.model.SpaService;
import com.hotelmanagement.service.SpaServiceService;
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
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SpaServiceController HTTP Tests")
class SpaServiceControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SpaServiceService spaServiceService;

    @InjectMocks
    private SpaServiceController spaServiceController;

    private ObjectMapper objectMapper;

    private SpaService sampleService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(spaServiceController).build();
        objectMapper = new ObjectMapper();

        sampleService = SpaService.builder()
                .id(1L)
                .name("Swedish Relaxation Massage")
                .description("Soothing full-body therapy")
                .category(SpaCategory.MASSAGE)
                .durationMinutes(60)
                .price(new BigDecimal("95.00"))
                .capacity(2)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("GET /api/spa-services - 200 OK returns all services")
    void testGetAllServices() throws Exception {
        when(spaServiceService.getAllServices()).thenReturn(List.of(sampleService));

        mockMvc.perform(get("/api/spa-services"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Swedish Relaxation Massage"))
                .andExpect(jsonPath("$[0].price").value(95.00));
    }

    @Test
    @DisplayName("GET /api/spa-services/active - 200 OK returns active services")
    void testGetActiveServices() throws Exception {
        when(spaServiceService.getActiveServices()).thenReturn(List.of(sampleService));

        mockMvc.perform(get("/api/spa-services/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].active").value(true));
    }

    @Test
    @DisplayName("GET /api/spa-services/{id} - 200 OK when found")
    void testGetServiceByIdFound() throws Exception {
        when(spaServiceService.getServiceById(1L)).thenReturn(Optional.of(sampleService));

        mockMvc.perform(get("/api/spa-services/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Swedish Relaxation Massage"));
    }

    @Test
    @DisplayName("GET /api/spa-services/{id} - 404 NOT FOUND when missing")
    void testGetServiceByIdNotFound() throws Exception {
        when(spaServiceService.getServiceById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/spa-services/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/spa-services - 201 CREATED for valid payload")
    void testCreateServiceSuccess() throws Exception {
        when(spaServiceService.createService(any(SpaService.class))).thenReturn(sampleService);

        mockMvc.perform(post("/api/spa-services")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleService)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Swedish Relaxation Massage"));
    }

    @Test
    @DisplayName("POST /api/spa-services - 400 BAD REQUEST on validation failure")
    void testCreateServiceValidationFailure() throws Exception {
        when(spaServiceService.createService(any(SpaService.class)))
                .thenThrow(new IllegalArgumentException("Price must be greater than zero"));

        mockMvc.perform(post("/api/spa-services")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleService)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Price must be greater than zero"));
    }

    @Test
    @DisplayName("PUT /api/spa-services/{id} - 200 OK when updated")
    void testUpdateServiceSuccess() throws Exception {
        when(spaServiceService.updateService(eq(1L), any(SpaService.class))).thenReturn(sampleService);

        mockMvc.perform(put("/api/spa-services/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleService)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("PUT /api/spa-services/{id} - 404 NOT FOUND when service does not exist")
    void testUpdateServiceNotFound() throws Exception {
        when(spaServiceService.updateService(eq(99L), any(SpaService.class)))
                .thenThrow(new IllegalArgumentException("Spa service not found with ID: 99"));

        mockMvc.perform(put("/api/spa-services/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleService)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/spa-services/{id} - 204 NO CONTENT on successful deletion")
    void testDeleteServiceSuccess() throws Exception {
        doNothing().when(spaServiceService).deleteService(1L);

        mockMvc.perform(delete("/api/spa-services/1"))
                .andExpect(status().isNoContent());
    }
}
