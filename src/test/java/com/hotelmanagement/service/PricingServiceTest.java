package com.hotelmanagement.service;

import com.hotelmanagement.model.RoomType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for PricingService covering price validation and categorization.
 */
@DisplayName("PricingService Unit Tests")
class PricingServiceTest {

    private PricingService pricingService;

    @BeforeEach
    void setUp() {
        pricingService = new PricingService();
    }

    // ===== Price Validation Tests (Boundary Value Analysis) =====

    @Test
    @DisplayName("Should validate price at minimum boundary (0.01)")
    void testValidPriceMinimum() {
        // Act & Assert
        assertThat(pricingService.isValidPrice(new BigDecimal("0.01"))).isTrue();
    }

    @Test
    @DisplayName("Should reject price at zero boundary")
    void testInvalidPriceZero() {
        // Act & Assert
        assertThat(pricingService.isValidPrice(BigDecimal.ZERO)).isFalse();
    }

    @Test
    @DisplayName("Should reject negative prices")
    void testInvalidNegativePrice() {
        // Act & Assert
        assertThat(pricingService.isValidPrice(new BigDecimal("-100"))).isFalse();
    }

    @Test
    @DisplayName("Should validate price at maximum boundary (10000)")
    void testValidPriceMaximum() {
        // Act & Assert
        assertThat(pricingService.isValidPrice(new BigDecimal("10000"))).isTrue();
    }

    @Test
    @DisplayName("Should reject price above maximum boundary (10001)")
    void testInvalidPriceAboveMaximum() {
        // Act & Assert
        assertThat(pricingService.isValidPrice(new BigDecimal("10001"))).isFalse();
    }

    @Test
    @DisplayName("Should reject null price")
    void testInvalidNullPrice() {
        // Act & Assert
        assertThat(pricingService.isValidPrice(null)).isFalse();
    }

    // ===== Price Category Equivalence Partitioning Tests =====

    @Test
    @DisplayName("Should categorize null price as INVALID")
    void testCategorizeNullPrice() {
        // Act
        String category = pricingService.getPriceCategory(null);

        // Assert
        assertThat(category).isEqualTo("INVALID");
    }

    @Test
    @DisplayName("Should categorize negative price as INVALID_NEGATIVE")
    void testCategorizeNegativePrice() {
        // Act
        String category = pricingService.getPriceCategory(new BigDecimal("-50"));

        // Assert
        assertThat(category).isEqualTo("INVALID_NEGATIVE");
    }

    @Test
    @DisplayName("Should categorize budget prices (0-100)")
    void testCategorizeBudgetPrice() {
        // Act
        String category50 = pricingService.getPriceCategory(new BigDecimal("50"));
        String category99 = pricingService.getPriceCategory(new BigDecimal("99.99"));

        // Assert
        assertThat(category50).isEqualTo("BUDGET");
        assertThat(category99).isEqualTo("BUDGET");
    }

    @Test
    @DisplayName("Should categorize standard prices (100-300)")
    void testCategorizeStandardPrice() {
        // Act
        String category100 = pricingService.getPriceCategory(new BigDecimal("100"));
        String category200 = pricingService.getPriceCategory(new BigDecimal("200"));
        String category299 = pricingService.getPriceCategory(new BigDecimal("299.99"));

        // Assert
        assertThat(category100).isEqualTo("STANDARD");
        assertThat(category200).isEqualTo("STANDARD");
        assertThat(category299).isEqualTo("STANDARD");
    }

    @Test
    @DisplayName("Should categorize premium prices (300-500)")
    void testCategorizePremiumPrice() {
        // Act
        String category300 = pricingService.getPriceCategory(new BigDecimal("300"));
        String category400 = pricingService.getPriceCategory(new BigDecimal("400"));
        String category499 = pricingService.getPriceCategory(new BigDecimal("499.99"));

        // Assert
        assertThat(category300).isEqualTo("PREMIUM");
        assertThat(category400).isEqualTo("PREMIUM");
        assertThat(category499).isEqualTo("PREMIUM");
    }

    @Test
    @DisplayName("Should categorize luxury prices (500-10000)")
    void testCategorizeLuxuryPrice() {
        // Act
        String category500 = pricingService.getPriceCategory(new BigDecimal("500"));
        String category750 = pricingService.getPriceCategory(new BigDecimal("750"));
        String category10000 = pricingService.getPriceCategory(new BigDecimal("10000"));

        // Assert
        assertThat(category500).isEqualTo("LUXURY");
        assertThat(category750).isEqualTo("LUXURY");
        assertThat(category10000).isEqualTo("LUXURY");
    }

    @Test
    @DisplayName("Should categorize excessive prices (>10000) as INVALID_TOO_HIGH")
    void testCategorizeExcessivePrice() {
        // Act
        String category = pricingService.getPriceCategory(new BigDecimal("10001"));

        // Assert
        assertThat(category).isEqualTo("INVALID_TOO_HIGH");
    }

    // ===== Room Type Price Mapping Tests =====

    @ParameterizedTest
    @CsvSource({
        "SINGLE,75",
        "DOUBLE,115",
        "SUITE,225",
        "DELUXE,375",
        "PENTHOUSE,750"
    })
    @DisplayName("Should return correct base price for room type")
    void testGetBasePriceForRoomType(RoomType roomType, String expectedPrice) {
        // Act
        BigDecimal price = pricingService.getBasePriceForRoomType(roomType);

        // Assert
        assertThat(price).isEqualByComparingTo(new BigDecimal(expectedPrice));
    }

    @Test
    @DisplayName("Should ensure all room type prices are within valid range")
    void testAllRoomTypePricesValid() {
        // Act & Assert
        for (RoomType roomType : RoomType.values()) {
            BigDecimal price = pricingService.getBasePriceForRoomType(roomType);
            assertThat(pricingService.isValidPrice(price))
                .as("Price for " + roomType + " should be valid")
                .isTrue();
        }
    }

    @Test
    @DisplayName("Should ensure room type prices follow hierarchy (ascending)")
    void testRoomTypePriceHierarchy() {
        // Act
        BigDecimal singlePrice = pricingService.getBasePriceForRoomType(RoomType.SINGLE);
        BigDecimal doublePrice = pricingService.getBasePriceForRoomType(RoomType.DOUBLE);
        BigDecimal suitePrice = pricingService.getBasePriceForRoomType(RoomType.SUITE);
        BigDecimal deluxePrice = pricingService.getBasePriceForRoomType(RoomType.DELUXE);
        BigDecimal penthousePrice = pricingService.getBasePriceForRoomType(RoomType.PENTHOUSE);

        // Assert
        assertThat(singlePrice).isLessThan(doublePrice);
        assertThat(doublePrice).isLessThan(suitePrice);
        assertThat(suitePrice).isLessThan(deluxePrice);
        assertThat(deluxePrice).isLessThan(penthousePrice);
    }
}
