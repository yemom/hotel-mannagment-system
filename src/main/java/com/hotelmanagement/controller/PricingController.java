package com.hotelmanagement.controller;

import com.hotelmanagement.model.RoomType;
import com.hotelmanagement.service.PricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingService pricingService;

    @GetMapping("/base-rates")
    public ResponseEntity<Map<RoomType, BigDecimal>> getBaseRates() {
        Map<RoomType, BigDecimal> rates = new LinkedHashMap<>();
        Arrays.stream(RoomType.values())
            .forEach(type -> rates.put(type, pricingService.getBasePriceForRoomType(type)));
        return ResponseEntity.ok(rates);
    }

    @GetMapping("/base-price/{roomType}")
    public ResponseEntity<BigDecimal> getBasePrice(@PathVariable RoomType roomType) {
        return ResponseEntity.ok(pricingService.getBasePriceForRoomType(roomType));
    }

    @GetMapping("/category")
    public ResponseEntity<String> getPriceCategory(@RequestParam BigDecimal price) {
        return ResponseEntity.ok(pricingService.getPriceCategory(price));
    }
}
