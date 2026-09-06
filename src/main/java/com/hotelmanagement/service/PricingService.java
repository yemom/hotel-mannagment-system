package com.hotelmanagement.service;

import com.hotelmanagement.model.Room;
import com.hotelmanagement.model.RoomType;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class PricingService {

    /**
     * Get base price for a room type.
     * Used for testing price band equivalence partitioning.
     * 
     * Price bands:
     * - SINGLE: $50-100
     * - DOUBLE: $80-150
     * - SUITE: $150-300
     * - DELUXE: $250-500
     * - PENTHOUSE: $500-1000
     */
    public BigDecimal getBasePriceForRoomType(RoomType roomType) {
        switch (roomType) {
            case SINGLE:
                return new BigDecimal("75");
            case DOUBLE:
                return new BigDecimal("115");
            case SUITE:
                return new BigDecimal("225");
            case DELUXE:
                return new BigDecimal("375");
            case PENTHOUSE:
                return new BigDecimal("750");
            default:
                return BigDecimal.ZERO;
        }
    }

    /**
     * Validate price is within acceptable range.
     */
    public boolean isValidPrice(BigDecimal price) {
        return price != null 
            && price.compareTo(BigDecimal.ZERO) > 0
            && price.compareTo(new BigDecimal("10000")) <= 0;
    }

    /**
     * Get price category for equivalence partitioning testing.
     */
    public String getPriceCategory(BigDecimal price) {
        if (price == null) {
            return "INVALID";
        }
        if (price.compareTo(BigDecimal.ZERO) <= 0) {
            return "INVALID_NEGATIVE";
        }
        if (price.compareTo(new BigDecimal("100")) < 0) {
            return "BUDGET";
        }
        if (price.compareTo(new BigDecimal("300")) < 0) {
            return "STANDARD";
        }
        if (price.compareTo(new BigDecimal("500")) < 0) {
            return "PREMIUM";
        }
        if (price.compareTo(new BigDecimal("10000")) <= 0) {
            return "LUXURY";
        }
        return "INVALID_TOO_HIGH";
    }
}
