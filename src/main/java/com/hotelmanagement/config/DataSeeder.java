package com.hotelmanagement.config;

import com.hotelmanagement.model.*;
import com.hotelmanagement.repository.GuestRepository;
import com.hotelmanagement.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds the database with a default super-admin guest account and
 * sample restaurant tables on every startup.
 * Uses H2 in-memory DB so data is re-seeded fresh each time.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final GuestRepository guestRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final com.hotelmanagement.repository.RoomRepository roomRepository;

    @org.springframework.beans.factory.annotation.Value("${superadmin.email:12yemom@gamail.com}")
    private String superAdminEmail;

    @org.springframework.beans.factory.annotation.Value("${superadmin.password:12345678}")
    private String superAdminPassword;

    @org.springframework.beans.factory.annotation.Value("${superadmin.firstName:Yemom}")
    private String superAdminFirstName;

    @org.springframework.beans.factory.annotation.Value("${superadmin.lastName:Admin}")
    private String superAdminLastName;

    @org.springframework.beans.factory.annotation.Value("${superadmin.phone:+251900000000}")
    private String superAdminPhone;

    @Override
    public void run(ApplicationArguments args) {
        int maxRetries = 10;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                seedSuperAdmin();
                seedRestaurantTables();
                seedRooms();
                log.info("DataSeeder completed successfully on attempt {}", attempt);
                return;
            } catch (Exception e) {
                if (attempt < maxRetries) {
                    log.warn("DataSeeder attempt {}/{} failed (tables may not be ready yet): {}. Retrying in 3s...",
                            attempt, maxRetries, e.getMessage());
                    try {
                        Thread.sleep(3000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                } else {
                    log.error("DataSeeder failed after {} attempts: {}", maxRetries, e.getMessage());
                }
            }
        }
    }

    private void seedSuperAdmin() {
        seedSingleAdmin("12yemom@gmail.com");
        seedSingleAdmin("12yemom@gamail.com");
        if (superAdminEmail != null && !superAdminEmail.equals("12yemom@gmail.com")
                && !superAdminEmail.equals("12yemom@gamail.com")) {
            seedSingleAdmin(superAdminEmail);
        }
    }

    private void seedSingleAdmin(String email) {
        var existing = guestRepository.findByEmail(email);
        if (existing.isEmpty()) {
            Guest superAdmin = Guest.builder()
                    .firstName(superAdminFirstName != null ? superAdminFirstName : "Yemom")
                    .lastName(superAdminLastName != null ? superAdminLastName : "Admin")
                    .email(email)
                    .password(superAdminPassword != null ? superAdminPassword : "12345678")
                    .phone(superAdminPhone != null ? superAdminPhone : "+251934046279")
                    .age(30)
                    .address("የ-mom Hotel HQ")
                    .city("Addis Ababa")
                    .country("Ethiopia")
                    .status(GuestStatus.ACTIVE)
                    .build();
            guestRepository.save(superAdmin);
            log.info("Super-admin account secured and seeded: {}", email);
        } else {
            Guest admin = existing.get();
            admin.setStatus(GuestStatus.ACTIVE);
            admin.setPassword(superAdminPassword != null ? superAdminPassword : "12345678");
            guestRepository.save(admin);
            log.info("Super-admin account verified and active: {}", email);
        }
    }

    private void seedRestaurantTables() {
        if (restaurantTableRepository.count() > 0) {
            log.info("Restaurant tables already seeded");
            return;
        }

        List<RestaurantTable> tables = List.of(
                // Main Hall — 8 tables (2–8 capacity)
                table("MH-01", 2, DiningArea.MAIN_HALL, "Window table by the main entrance with natural daylight"),
                table("MH-02", 4, DiningArea.MAIN_HALL, "Cozy centre booth, great for couples & small families"),
                table("MH-03", 4, DiningArea.MAIN_HALL, "Beside grand window overlooking the courtyard fountain"),
                table("MH-04", 6, DiningArea.MAIN_HALL, "Large round table near the live acoustic grand piano"),
                table("MH-05", 2, DiningArea.MAIN_HALL, "Intimate romantic corner with candlelight"),
                table("MH-06", 8, DiningArea.MAIN_HALL, "Extended dining table for special group events"),
                table("MH-07", 4, DiningArea.MAIN_HALL, "Central chandelier table with prime restaurant view"),
                table("MH-08", 4, DiningArea.MAIN_HALL, "Premium panoramic window booth with skyline view"),

                // Terrace & Balcony — 6 tables (2–6 capacity)
                table("TR-01", 2, DiningArea.TERRACE,
                        "Panoramic balcony table with breathtaking open-air sunset vista"),
                table("TR-02", 4, DiningArea.TERRACE, "Poolside pergola terrace seating with gentle breeze"),
                table("TR-03", 4, DiningArea.TERRACE, "Under the olive tree, al fresco dining experience"),
                table("TR-04", 6, DiningArea.TERRACE, "Covered terrace deck, ideal for twilight dinners"),
                table("TR-05", 2, DiningArea.TERRACE, "Front-row rooftop balcony table for romantic sunsets"),
                table("TR-06", 6, DiningArea.TERRACE, "Terrace pavilion table with personal fire-pit"),

                // Private Dining Suites — 4 tables (6–12 capacity)
                table("PR-01", 8, DiningArea.PRIVATE_ROOM, "Executive dining suite with dedicated sommelier & full AV"),
                table("PR-02", 12, DiningArea.PRIVATE_ROOM,
                        "Royal banquet hall for grand celebrations & family reunions"),
                table("PR-03", 6, DiningArea.PRIVATE_ROOM, "Intimate wine cellar private booth with reserve pairings"),
                table("PR-04", 10, DiningArea.PRIVATE_ROOM, "VIP penthouse dining room with private terrace access"));

        restaurantTableRepository.saveAll(tables);
        log.info("Seeded {} restaurant tables", tables.size());
    }

    private RestaurantTable table(String number, int capacity, DiningArea area, String description) {
        return RestaurantTable.builder()
                .tableNumber(number)
                .capacity(capacity)
                .area(area)
                .status(TableStatus.AVAILABLE)
                .description(description)
                .build();
    }

    private void seedRooms() {
        List<Room> rooms = List.of(
                room("101", RoomType.SINGLE, new java.math.BigDecimal("85.00"), 1,
                        "Cozy retreat with a plush queen bed, dedicated ergonomic workstation, and quiet garden views.",
                        false, false, true),
                room("102", RoomType.DOUBLE, new java.math.BigDecimal("140.00"), 2,
                        "Spacious modern room featuring two premium queen beds, artisan coffee bar, and skyline windows.",
                        true, false, true),
                room("103", RoomType.SINGLE, new java.math.BigDecimal("95.00"), 1,
                        "Serene corner single with floor-to-ceiling windows and acoustic soundproofing.", false, true,
                        true),
                room("104", RoomType.SINGLE, new java.math.BigDecimal("90.00"), 1,
                        "Sunlit garden single with French doors leading to a private botanical courtyard.", false,
                        false, false),
                room("201", RoomType.SUITE, new java.math.BigDecimal("220.00"), 3,
                        "Executive boutique suite with a partitioned salon lounge, Italian marble bath, and private terrace.",
                        true, true, true),
                room("202", RoomType.DOUBLE, new java.math.BigDecimal("155.00"), 2,
                        "Superior double with sweeping courtyard views and complimentary artisan refreshments.", true,
                        true, true),
                room("203", RoomType.DOUBLE, new java.math.BigDecimal("145.00"), 2,
                        "Artisan twin double with custom timber furnishings, designer reading nook, and espresso bar.",
                        false, false, true),
                room("204", RoomType.DOUBLE, new java.math.BigDecimal("160.00"), 2,
                        "Corner double suite with wrap-around city panorama, heated bathroom floors, and balcony.",
                        true, true, true),
                room("301", RoomType.DELUXE, new java.math.BigDecimal("290.00"), 4,
                        "Ultra-luxurious corner suite with panoramic city skyline panorama, walk-in dressing room, and deep tub.",
                        true, true, true),
                room("302", RoomType.SUITE, new java.math.BigDecimal("240.00"), 3,
                        "Grand family suite with dual vanity bath, private sun deck, and plush sleeper sofa.", true,
                        true, true),
                room("303", RoomType.SUITE, new java.math.BigDecimal("255.00"), 3,
                        "Romantic honeymoon suite with private jacuzzi, champagne service, and rose-petal turndown.",
                        true, true, true),
                room("304", RoomType.DELUXE, new java.math.BigDecimal("310.00"), 4,
                        "Royal deluxe family suite with dual king suites, private dining nook, and full luxury amenities.",
                        true, true, true),
                room("401", RoomType.PENTHOUSE, new java.math.BigDecimal("480.00"), 4,
                        "Top-floor presidential penthouse with private wraparound balcony, fireplace salon, and butler service pantry.",
                        true, true, true),
                room("402", RoomType.PENTHOUSE, new java.math.BigDecimal("520.00"), 5,
                        "Sky-level penthouse estate with private rooftop plunge pool, dedicated chef service, and helipad access.",
                        true, true, true));

        int added = 0;
        for (Room r : rooms) {
            if (roomRepository.findByRoomNumber(r.getRoomNumber()).isEmpty()) {
                roomRepository.save(r);
                added++;
            }
        }
        log.info("Ensured {} hotel rooms are registered in inventory ({} newly seeded)", rooms.size(), added);
    }

    private Room room(String roomNumber, RoomType roomType, java.math.BigDecimal basePrice, Integer capacity,
            String description, Boolean hasBathtub, Boolean hasBalcony, Boolean hasMinibar) {
        return Room.builder()
                .roomNumber(roomNumber)
                .roomType(roomType)
                .basePrice(basePrice)
                .capacity(capacity)
                .status(RoomStatus.AVAILABLE)
                .description(description)
                .hasBathtub(hasBathtub)
                .hasBalcony(hasBalcony)
                .hasMinibar(hasMinibar)
                .build();
    }
}
