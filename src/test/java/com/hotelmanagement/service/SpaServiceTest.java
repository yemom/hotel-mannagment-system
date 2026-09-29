package com.hotelmanagement.service;

import com.hotelmanagement.model.SpaCategory;
import com.hotelmanagement.model.SpaService;
import com.hotelmanagement.repository.SpaServiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SpaService Unit & Boundary Value Tests")
class SpaServiceTest {

    private SpaServiceService spaServiceService;

    @Mock
    private SpaServiceRepository spaServiceRepository;

    @BeforeEach
    void setUp() {
        spaServiceService = new SpaServiceService(spaServiceRepository);
    }

    private SpaService.SpaServiceBuilder validServiceBuilder() {
        return SpaService.builder()
                .id(1L)
                .name("Swedish Relaxation Massage")
                .description("Soothing full body massage")
                .category(SpaCategory.MASSAGE)
                .durationMinutes(60)
                .price(new BigDecimal("95.00"))
                .capacity(2)
                .active(true);
    }

    @Nested
    @DisplayName("Service Creation & Equivalence Classes")
    class ServiceCreationTests {

        @Test
        @DisplayName("Should successfully create valid spa service")
        void testCreateValidSpaService() {
            SpaService service = validServiceBuilder().build();
            when(spaServiceRepository.save(any(SpaService.class))).thenReturn(service);

            SpaService created = spaServiceService.createService(service);

            assertThat(created).isNotNull();
            assertThat(created.getName()).isEqualTo("Swedish Relaxation Massage");
            assertThat(created.getCategory()).isEqualTo(SpaCategory.MASSAGE);
            assertThat(created.getActive()).isTrue();
            verify(spaServiceRepository, times(1)).save(service);
        }

        @ParameterizedTest
        @CsvSource({
                "MASSAGE, Swedish Relaxation Massage",
                "FACIAL, Luxury Radiance Facial",
                "BODY_TREATMENT, Mineral Body Scrub",
                "WELLNESS, Organic Aromatherapy",
                "COUPLES, Couples Sanctuary",
                "BEAUTY, Botanical Glow"
        })
        @DisplayName("Should create services across all valid categories")
        void testCreateServiceInAllCategories(SpaCategory category, String name) {
            SpaService service = validServiceBuilder()
                    .category(category)
                    .name(name)
                    .build();

            when(spaServiceRepository.save(any(SpaService.class))).thenReturn(service);

            SpaService created = spaServiceService.createService(service);
            assertThat(created.getCategory()).isEqualTo(category);
            assertThat(created.getName()).isEqualTo(name);
        }

        @Test
        @DisplayName("Should reject null service")
        void testRejectNullService() {
            assertThatThrownBy(() -> spaServiceService.createService(null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("null");
        }

        @Test
        @DisplayName("Should reject null or blank name")
        void testRejectNullOrBlankName() {
            SpaService nullName = validServiceBuilder().name(null).build();
            assertThatThrownBy(() -> spaServiceService.createService(nullName))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("name");

            SpaService blankName = validServiceBuilder().name("   ").build();
            assertThatThrownBy(() -> spaServiceService.createService(blankName))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("name");
        }

        @Test
        @DisplayName("Should reject null category")
        void testRejectNullCategory() {
            SpaService service = validServiceBuilder().category(null).build();
            assertThatThrownBy(() -> spaServiceService.createService(service))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("category");
        }
    }

    @Nested
    @DisplayName("Boundary Value Testing: Price")
    class PriceBoundaryTests {

        @ParameterizedTest
        @CsvSource({
                "0.01",    // Boundary minimum valid
                "50.00",   // Typical valid
                "5000.00"  // Boundary maximum valid
        })
        @DisplayName("Valid price boundary values should be accepted")
        void testValidPriceBoundaries(String priceStr) {
            BigDecimal price = new BigDecimal(priceStr);
            SpaService service = validServiceBuilder().price(price).build();
            when(spaServiceRepository.save(any(SpaService.class))).thenReturn(service);

            SpaService created = spaServiceService.createService(service);
            assertThat(created.getPrice()).isEqualByComparingTo(price);
        }

        @ParameterizedTest
        @CsvSource({
                "0.00",     // Zero price - invalid
                "-0.01",    // Negative price - invalid
                "-50.00",   // Large negative price - invalid
                "5000.01",  // Exceeds upper boundary - invalid
                "9999.00"   // Way above limit - invalid
        })
        @DisplayName("Invalid price boundary values should be rejected")
        void testInvalidPriceBoundaries(String priceStr) {
            BigDecimal price = new BigDecimal(priceStr);
            SpaService service = validServiceBuilder().price(price).build();

            assertThatThrownBy(() -> spaServiceService.createService(service))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Null price should be rejected")
        void testNullPriceRejected() {
            SpaService service = validServiceBuilder().price(null).build();
            assertThatThrownBy(() -> spaServiceService.createService(service))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Price");
        }
    }

    @Nested
    @DisplayName("Boundary Value Testing: Duration")
    class DurationBoundaryTests {

        @ParameterizedTest
        @ValueSource(ints = {15, 30, 60, 90, 120, 480})
        @DisplayName("Valid duration boundary values [15, 480] minutes should be accepted")
        void testValidDurationBoundaries(int duration) {
            SpaService service = validServiceBuilder().durationMinutes(duration).build();
            when(spaServiceRepository.save(any(SpaService.class))).thenReturn(service);

            SpaService created = spaServiceService.createService(service);
            assertThat(created.getDurationMinutes()).isEqualTo(duration);
        }

        @ParameterizedTest
        @ValueSource(ints = {0, 1, 14, 481, 600})
        @DisplayName("Invalid duration boundary values (<15 or >480) should be rejected")
        void testInvalidDurationBoundaries(int duration) {
            SpaService service = validServiceBuilder().durationMinutes(duration).build();

            assertThatThrownBy(() -> spaServiceService.createService(service))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Duration");
        }

        @Test
        @DisplayName("Null duration should be rejected")
        void testNullDurationRejected() {
            SpaService service = validServiceBuilder().durationMinutes(null).build();
            assertThatThrownBy(() -> spaServiceService.createService(service))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Duration");
        }
    }

    @Nested
    @DisplayName("Boundary Value Testing: Capacity")
    class CapacityBoundaryTests {

        @ParameterizedTest
        @ValueSource(ints = {1, 2, 4, 10, 20})
        @DisplayName("Valid capacity boundary values [1, 20] should be accepted")
        void testValidCapacityBoundaries(int capacity) {
            SpaService service = validServiceBuilder().capacity(capacity).build();
            when(spaServiceRepository.save(any(SpaService.class))).thenReturn(service);

            SpaService created = spaServiceService.createService(service);
            assertThat(created.getCapacity()).isEqualTo(capacity);
        }

        @ParameterizedTest
        @ValueSource(ints = {0, -1, 21, 50})
        @DisplayName("Invalid capacity boundary values (<1 or >20) should be rejected")
        void testInvalidCapacityBoundaries(int capacity) {
            SpaService service = validServiceBuilder().capacity(capacity).build();

            assertThatThrownBy(() -> spaServiceService.createService(service))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Capacity");
        }
    }

    @Nested
    @DisplayName("Service Lookup, Update & Status Changes")
    class ServiceLifecycleTests {

        @Test
        @DisplayName("Should retrieve active services only")
        void testGetActiveServices() {
            SpaService active1 = validServiceBuilder().id(1L).active(true).build();
            SpaService active2 = validServiceBuilder().id(2L).name("Facial").active(true).build();
            when(spaServiceRepository.findByActiveTrue()).thenReturn(List.of(active1, active2));

            List<SpaService> active = spaServiceService.getActiveServices();

            assertThat(active).hasSize(2);
            assertThat(active).extracting(SpaService::getActive).containsOnly(true);
        }

        @Test
        @DisplayName("Should retrieve service by ID")
        void testGetServiceById() {
            SpaService service = validServiceBuilder().id(10L).build();
            when(spaServiceRepository.findById(10L)).thenReturn(Optional.of(service));

            Optional<SpaService> found = spaServiceService.getServiceById(10L);

            assertThat(found).isPresent();
            assertThat(found.get().getId()).isEqualTo(10L);
        }

        @Test
        @DisplayName("Should return empty for non-existent service ID")
        void testGetNonExistentService() {
            when(spaServiceRepository.findById(999L)).thenReturn(Optional.empty());

            Optional<SpaService> found = spaServiceService.getServiceById(999L);
            assertThat(found).isEmpty();
        }

        @Test
        @DisplayName("Should update existing service fields")
        void testUpdateExistingService() {
            SpaService existing = validServiceBuilder().id(1L).name("Old Name").build();
            when(spaServiceRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(spaServiceRepository.save(any(SpaService.class))).thenAnswer(inv -> inv.getArgument(0));

            SpaService updateDto = SpaService.builder()
                    .name("New Luxury Treatment")
                    .price(new BigDecimal("150.00"))
                    .durationMinutes(90)
                    .build();

            SpaService updated = spaServiceService.updateService(1L, updateDto);

            assertThat(updated.getName()).isEqualTo("New Luxury Treatment");
            assertThat(updated.getPrice()).isEqualByComparingTo("150.00");
            assertThat(updated.getDurationMinutes()).isEqualTo(90);
        }

        @Test
        @DisplayName("Should deactivate service successfully")
        void testDeactivateService() {
            SpaService existing = validServiceBuilder().id(5L).active(true).build();
            when(spaServiceRepository.findById(5L)).thenReturn(Optional.of(existing));
            when(spaServiceRepository.save(any(SpaService.class))).thenAnswer(inv -> inv.getArgument(0));

            SpaService deactivated = spaServiceService.deactivateService(5L);

            assertThat(deactivated.getActive()).isFalse();
        }

        @Test
        @DisplayName("Should reactivate inactive service")
        void testActivateService() {
            SpaService existing = validServiceBuilder().id(5L).active(false).build();
            when(spaServiceRepository.findById(5L)).thenReturn(Optional.of(existing));
            when(spaServiceRepository.save(any(SpaService.class))).thenAnswer(inv -> inv.getArgument(0));

            SpaService activated = spaServiceService.activateService(5L);

            assertThat(activated.getActive()).isTrue();
        }
    }

    @Nested
    @DisplayName("Domain Model Method Tests")
    class DomainModelTests {

        @Test
        @DisplayName("isValidPrice domain method verification")
        void testDomainIsValidPrice() {
            SpaService service = validServiceBuilder().price(new BigDecimal("100.00")).build();
            assertThat(service.isValidPrice()).isTrue();

            service.setPrice(BigDecimal.ZERO);
            assertThat(service.isValidPrice()).isFalse();

            service.setPrice(new BigDecimal("-10.00"));
            assertThat(service.isValidPrice()).isFalse();

            service.setPrice(new BigDecimal("5001.00"));
            assertThat(service.isValidPrice()).isFalse();
        }

        @Test
        @DisplayName("isValidDuration domain method verification")
        void testDomainIsValidDuration() {
            SpaService service = validServiceBuilder().durationMinutes(60).build();
            assertThat(service.isValidDuration()).isTrue();

            service.setDurationMinutes(14);
            assertThat(service.isValidDuration()).isFalse();

            service.setDurationMinutes(481);
            assertThat(service.isValidDuration()).isFalse();
        }

        @Test
        @DisplayName("isValidCapacity domain method verification")
        void testDomainIsValidCapacity() {
            SpaService service = validServiceBuilder().capacity(2).build();
            assertThat(service.isValidCapacity()).isTrue();

            service.setCapacity(0);
            assertThat(service.isValidCapacity()).isFalse();

            service.setCapacity(21);
            assertThat(service.isValidCapacity()).isFalse();
        }
    }
}
