package com.hotelmanagement.controller;

import com.hotelmanagement.model.RoomType;
import com.hotelmanagement.service.PricingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("PricingController HTTP Tests")
class PricingControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PricingService pricingService;

    @InjectMocks
    private PricingController pricingController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(pricingController).build();
    }

    @Test
    @DisplayName("GET /api/pricing/base-rates - 200 OK returns all base rates")
    void testGetBaseRates() throws Exception {
        when(pricingService.getBasePriceForRoomType(RoomType.SINGLE)).thenReturn(new BigDecimal("75"));
        when(pricingService.getBasePriceForRoomType(RoomType.DOUBLE)).thenReturn(new BigDecimal("115"));
        when(pricingService.getBasePriceForRoomType(RoomType.SUITE)).thenReturn(new BigDecimal("225"));
        when(pricingService.getBasePriceForRoomType(RoomType.DELUXE)).thenReturn(new BigDecimal("375"));
        when(pricingService.getBasePriceForRoomType(RoomType.PENTHOUSE)).thenReturn(new BigDecimal("750"));

        mockMvc.perform(get("/api/pricing/base-rates"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/pricing/base-price/{roomType} - 200 OK returns price for room type")
    void testGetBasePrice() throws Exception {
        when(pricingService.getBasePriceForRoomType(RoomType.DOUBLE)).thenReturn(new BigDecimal("115"));

        mockMvc.perform(get("/api/pricing/base-price/DOUBLE"))
                .andExpect(status().isOk())
                .andExpect(content().string("115"));
    }

    @Test
    @DisplayName("GET /api/pricing/category - 200 OK returns category string")
    void testGetPriceCategory() throws Exception {
        when(pricingService.getPriceCategory(new BigDecimal("150"))).thenReturn("STANDARD");

        mockMvc.perform(get("/api/pricing/category")
                        .param("price", "150"))
                .andExpect(status().isOk())
                .andExpect(content().string("STANDARD"));
    }
}
