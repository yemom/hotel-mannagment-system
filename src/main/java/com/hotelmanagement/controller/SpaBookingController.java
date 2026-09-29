package com.hotelmanagement.controller;

import com.hotelmanagement.model.Guest;
import com.hotelmanagement.model.SpaBooking;
import com.hotelmanagement.model.SpaService;
import com.hotelmanagement.service.SpaBookingService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/spa-bookings", "/spa-bookings", "/api/spa/bookings", "/spa/bookings"})
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class SpaBookingController {

    private final SpaBookingService spaBookingService;

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody SpaBookingRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Request body cannot be null"));
        }
        try {
            SpaBooking booking = SpaBooking.builder()
                    .guest(Guest.builder().id(request.getGuestId()).build())
                    .spaService(SpaService.builder().id(request.getSpaServiceId()).build())
                    .bookingDate(request.getBookingDate())
                    .startTime(request.getStartTime())
                    .numberOfGuests(request.getNumberOfGuests())
                    .specialRequests(request.getSpecialRequests())
                    .build();

            SpaBooking created = spaBookingService.createBooking(booking);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalStateException e) {
            // Capacity conflict
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<SpaBooking>> getAllBookings() {
        return ResponseEntity.ok(spaBookingService.getAllBookings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SpaBooking> getBookingById(@PathVariable Long id) {
        return spaBookingService.getBookingById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/guest/{guestId}")
    public ResponseEntity<List<SpaBooking>> getBookingsByGuest(@PathVariable Long guestId) {
        return ResponseEntity.ok(spaBookingService.getBookingsByGuest(guestId));
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<SpaBooking>> getBookingsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(spaBookingService.getBookingsByDate(date));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirmBooking(@PathVariable Long id) {
        try {
            SpaBooking confirmed = spaBookingService.confirmBooking(id);
            return ResponseEntity.ok(confirmed);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeBooking(@PathVariable Long id) {
        try {
            SpaBooking completed = spaBookingService.completeBooking(id);
            return ResponseEntity.ok(completed);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        try {
            SpaBooking cancelled = spaBookingService.cancelBooking(id);
            return ResponseEntity.ok(cancelled);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @Data
    public static class SpaBookingRequest {
        private Long guestId;
        private Long spaServiceId;
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate bookingDate;
        private String startTime;
        private Integer numberOfGuests;
        private String specialRequests;
    }
}
