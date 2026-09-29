package com.hotelmanagement.service;

import com.hotelmanagement.model.*;
import com.hotelmanagement.repository.GuestRepository;
import com.hotelmanagement.repository.SpaBookingRepository;
import com.hotelmanagement.repository.SpaServiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Spa Module End-to-End Integration Tests")
class SpaIntegrationTest {

    @Autowired
    private SpaServiceService spaServiceService;

    @Autowired
    private SpaBookingService spaBookingService;

    @Autowired
    private GuestService guestService;

    @Autowired
    private SpaBookingRepository spaBookingRepository;

    @Autowired
    private SpaServiceRepository spaServiceRepository;

    @Autowired
    private GuestRepository guestRepository;

    @BeforeEach
    void setUp() {
        spaBookingRepository.deleteAll();
        spaServiceRepository.deleteAll();
    }

    private Guest createTestGuest(String email) {
        String uniqueEmail = "spa." + java.util.UUID.randomUUID().toString().substring(0, 8) + "." + email;
        Guest guest = Guest.builder()
                .firstName("Elena")
                .lastName("Rostova")
                .email(uniqueEmail)
                .password("SecurePass123!")
                .phone("+251911998877")
                .age(28)
                .status(GuestStatus.ACTIVE)
                .build();
        return guestService.registerGuest(guest);
    }

    private SpaService createTestService(String name, int capacity) {
        SpaService service = SpaService.builder()
                .name(name)
                .description("Holistic rejuvenation treatment")
                .category(SpaCategory.MASSAGE)
                .durationMinutes(60)
                .price(new BigDecimal("120.00"))
                .capacity(capacity)
                .active(true)
                .build();
        return spaServiceService.createService(service);
    }

    // 1. Create spa service
    @Test
    @DisplayName("Integration: 1. Create spa service")
    void testCreateSpaService() {
        SpaService created = createTestService("Signature Aromatherapy Massage", 2);

        assertThat(created.getId()).isNotNull();
        assertThat(created.getName()).isEqualTo("Signature Aromatherapy Massage");
        assertThat(created.getActive()).isTrue();
    }

    // 2. Retrieve spa service
    @Test
    @DisplayName("Integration: 2. Retrieve spa service")
    void testRetrieveSpaService() {
        SpaService created = createTestService("Luxury Radiance Facial", 1);

        SpaService retrieved = spaServiceService.getServiceById(created.getId()).orElseThrow();
        assertThat(retrieved.getName()).isEqualTo("Luxury Radiance Facial");
        assertThat(retrieved.getCategory()).isEqualTo(SpaCategory.MASSAGE);
    }

    // 3. Update spa service
    @Test
    @DisplayName("Integration: 3. Update spa service")
    void testUpdateSpaService() {
        SpaService created = createTestService("Old Treatment Name", 2);

        SpaService updateDto = SpaService.builder()
                .name("Updated Premium Herbal Massage")
                .price(new BigDecimal("150.00"))
                .durationMinutes(90)
                .build();

        SpaService updated = spaServiceService.updateService(created.getId(), updateDto);

        assertThat(updated.getName()).isEqualTo("Updated Premium Herbal Massage");
        assertThat(updated.getPrice()).isEqualByComparingTo("150.00");
        assertThat(updated.getDurationMinutes()).isEqualTo(90);
    }

    // 4. Deactivate spa service
    @Test
    @DisplayName("Integration: 4. Deactivate spa service")
    void testDeactivateSpaService() {
        SpaService created = createTestService("Seasonal Body Scrub", 2);

        SpaService deactivated = spaServiceService.deactivateService(created.getId());
        assertThat(deactivated.getActive()).isFalse();

        List<SpaService> activeList = spaServiceService.getActiveServices();
        assertThat(activeList).noneMatch(s -> s.getId().equals(created.getId()));
    }

    // 5 & 6. Create and persist spa booking
    @Test
    @DisplayName("Integration: 5 & 6. Create and persist spa booking")
    void testCreateAndPersistSpaBooking() {
        Guest guest = createTestGuest("elena@example.com");
        SpaService service = createTestService("Deep Tissue Therapy", 2);

        LocalDate date = LocalDate.now().plusDays(2);
        SpaBooking booking = SpaBooking.builder()
                .guest(guest)
                .spaService(service)
                .bookingDate(date)
                .startTime("10:00")
                .numberOfGuests(2)
                .specialRequests("Lavender aromatherapy oils")
                .build();

        SpaBooking persisted = spaBookingService.createBooking(booking);

        assertThat(persisted.getId()).isNotNull();
        assertThat(persisted.getStatus()).isEqualTo(SpaBookingStatus.PENDING);
        // Price: 120.00 * 2 = 240.00
        assertThat(persisted.getTotalPrice()).isEqualByComparingTo("240.00");
        assertThat(persisted.getDuration()).isEqualTo(60);
    }

    // 7. Retrieve booking
    @Test
    @DisplayName("Integration: 7. Retrieve booking by ID")
    void testRetrieveBooking() {
        Guest guest = createTestGuest("guest.retrieve@example.com");
        SpaService service = createTestService("Swedish Massage", 2);

        SpaBooking booking = SpaBooking.builder()
                .guest(guest)
                .spaService(service)
                .bookingDate(LocalDate.now().plusDays(1))
                .startTime("15:00")
                .numberOfGuests(1)
                .build();

        SpaBooking created = spaBookingService.createBooking(booking);
        SpaBooking retrieved = spaBookingService.getBookingById(created.getId()).orElseThrow();

        assertThat(retrieved.getId()).isEqualTo(created.getId());
        assertThat(retrieved.getGuest().getEmail()).isEqualTo(guest.getEmail());
    }

    // 8. Retrieve bookings by guest
    @Test
    @DisplayName("Integration: 8. Retrieve bookings by guest")
    void testRetrieveBookingsByGuest() {
        Guest guest1 = createTestGuest("guest1@example.com");
        Guest guest2 = createTestGuest("guest2@example.com");
        SpaService service = createTestService("Swedish Massage", 4);

        SpaBooking booking1 = SpaBooking.builder()
                .guest(guest1)
                .spaService(service)
                .bookingDate(LocalDate.now().plusDays(1))
                .startTime("10:00")
                .numberOfGuests(1)
                .build();

        SpaBooking booking2 = SpaBooking.builder()
                .guest(guest1)
                .spaService(service)
                .bookingDate(LocalDate.now().plusDays(2))
                .startTime("14:00")
                .numberOfGuests(1)
                .build();

        SpaBooking booking3 = SpaBooking.builder()
                .guest(guest2)
                .spaService(service)
                .bookingDate(LocalDate.now().plusDays(3))
                .startTime("16:00")
                .numberOfGuests(1)
                .build();

        spaBookingService.createBooking(booking1);
        spaBookingService.createBooking(booking2);
        spaBookingService.createBooking(booking3);

        List<SpaBooking> guest1Bookings = spaBookingService.getBookingsByGuest(guest1.getId());
        assertThat(guest1Bookings).hasSize(2);

        List<SpaBooking> guest2Bookings = spaBookingService.getBookingsByGuest(guest2.getId());
        assertThat(guest2Bookings).hasSize(1);
    }

    // 9. Cancel booking
    @Test
    @DisplayName("Integration: 9. Cancel booking")
    void testCancelBooking() {
        Guest guest = createTestGuest("cancel.guest@example.com");
        SpaService service = createTestService("Relaxation Massage", 2);

        SpaBooking booking = SpaBooking.builder()
                .guest(guest)
                .spaService(service)
                .bookingDate(LocalDate.now().plusDays(1))
                .startTime("11:00")
                .numberOfGuests(1)
                .build();

        SpaBooking created = spaBookingService.createBooking(booking);
        SpaBooking cancelled = spaBookingService.cancelBooking(created.getId());

        assertThat(cancelled.getStatus()).isEqualTo(SpaBookingStatus.CANCELLED);
    }

    // 10. Capacity conflict
    @Test
    @DisplayName("Integration: 10. Capacity conflict rejection")
    void testCapacityConflict() {
        Guest guest1 = createTestGuest("c1@example.com");
        Guest guest2 = createTestGuest("c2@example.com");
        // Capacity = 2
        SpaService service = createTestService("Intimate Couple Room", 2);

        LocalDate date = LocalDate.now().plusDays(4);
        String time = "16:00";

        SpaBooking booking1 = SpaBooking.builder()
                .guest(guest1)
                .spaService(service)
                .bookingDate(date)
                .startTime(time)
                .numberOfGuests(2) // Fills entire capacity of 2
                .build();

        spaBookingService.createBooking(booking1);

        // Second booking requests 1 more slot on same date & time
        SpaBooking booking2 = SpaBooking.builder()
                .guest(guest2)
                .spaService(service)
                .bookingDate(date)
                .startTime(time)
                .numberOfGuests(1)
                .build();

        assertThatThrownBy(() -> spaBookingService.createBooking(booking2))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Capacity conflict");
    }

    // 11. Invalid booking request
    @Test
    @DisplayName("Integration: 11. Invalid booking request rejection")
    void testInvalidBookingRequest() {
        Guest guest = createTestGuest("invalid.req@example.com");
        SpaService service = createTestService("Test Service", 2);

        // Past date
        SpaBooking pastBooking = SpaBooking.builder()
                .guest(guest)
                .spaService(service)
                .bookingDate(LocalDate.now().minusDays(1))
                .startTime("10:00")
                .numberOfGuests(1)
                .build();

        assertThatThrownBy(() -> spaBookingService.createBooking(pastBooking))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("past");

        // Exceeds service capacity
        SpaBooking overCapacity = SpaBooking.builder()
                .guest(guest)
                .spaService(service)
                .bookingDate(LocalDate.now().plusDays(1))
                .startTime("10:00")
                .numberOfGuests(5) // Max is 2
                .build();

        assertThatThrownBy(() -> spaBookingService.createBooking(overCapacity))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exceeds");
    }
}
