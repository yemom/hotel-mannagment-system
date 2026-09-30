package com.hotelmanagement.controller;

import com.hotelmanagement.model.Reservation;
import com.hotelmanagement.model.Guest;
import com.hotelmanagement.model.Room;
import com.hotelmanagement.repository.GuestRepository;
import com.hotelmanagement.repository.RoomRepository;
import com.hotelmanagement.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/reservations", "/reservations"})
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;
    private final GuestRepository guestRepository;
    private final RoomRepository roomRepository;

    @PostMapping
    public ResponseEntity<?> createReservation(@RequestBody ReservationRequest request) {
        try {
            Guest guest = guestRepository.findById(request.getGuestId())
                .orElseThrow(() -> new IllegalArgumentException("Guest not found"));
            Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
            Reservation reservation = Reservation.builder()
                .guest(guest)
                .room(room)
                .checkInDate(request.getCheckInDate())
                .checkOutDate(request.getCheckOutDate())
                .numberOfGuests(request.getNumberOfGuests())
                .specialRequests(request.getSpecialRequests())
                .build();
            Reservation created = reservationService.createReservation(reservation);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Reservation>> getPendingReservations() {
        return ResponseEntity.ok(reservationService.getPendingReservations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reservation> getReservation(@PathVariable Long id) {
        return reservationService.getReservation(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Reservation>> getAllReservations() {
        return ResponseEntity.ok(reservationService.getAllReservations());
    }

    @GetMapping("/guest/{guestId}")
    public ResponseEntity<List<Reservation>> getReservationsByGuest(@PathVariable Long guestId) {
        return ResponseEntity.ok(reservationService.getReservationsByGuest(guestId));
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<Reservation>> getReservationsByRoom(@PathVariable Long roomId) {
        return ResponseEntity.ok(reservationService.getReservationsByRoom(roomId));
    }

    /**
     * Re-schedules a room reservation owned by the acting guest.
     * 403 when the caller does not own it, 400 for invalid input, 409 when unavailable.
     */
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> rescheduleReservation(@PathVariable Long id,
                                                   @RequestBody RescheduleRequest request) {
        try {
            Reservation updated = reservationService.rescheduleReservation(
                id,
                request.getCheckInDate(),
                request.getCheckOutDate(),
                request.getNumberOfGuests(),
                request.getActingGuestId());
            return ResponseEntity.ok(updated);
        } catch (com.hotelmanagement.exception.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirmReservation(@PathVariable Long id,
                                                @RequestParam(required = false) String actingRole) {
        if (!isAuthorizedStaff(actingRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(errorBody("Only authorised staff may confirm reservations"));
        }
        try {
            Reservation confirmed = reservationService.confirmReservation(id);
            return ResponseEntity.ok(confirmed);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{id}/check-in")
    public ResponseEntity<?> checkIn(@PathVariable Long id) {
        try {
            Reservation checkedIn = reservationService.checkIn(id);
            return ResponseEntity.ok(checkedIn);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{id}/check-out")
    public ResponseEntity<?> checkOut(@PathVariable Long id) {
        try {
            Reservation checkedOut = reservationService.checkOut(id);
            return ResponseEntity.ok(checkedOut);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelReservation(@PathVariable Long id,
                                               @RequestParam(required = false) Long actingGuestId) {
        try {
            Reservation cancelled = (actingGuestId != null)
                ? reservationService.cancelReservationAs(id, actingGuestId)
                : reservationService.cancelReservation(id);
            return ResponseEntity.ok(cancelled);
        } catch (com.hotelmanagement.exception.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody(e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    private boolean isAuthorizedStaff(String actingRole) {
        if (actingRole == null || actingRole.trim().isEmpty()) {
            return true;
        }
        String r = actingRole.trim().toLowerCase();
        return r.equals("admin") || r.equals("super_admin") || r.equals("manager")
            || r.equals("staff") || r.equals("receptionist") || r.equals("true");
    }

    /**
     * Permanently deletes a reservation row (booking-desk cleanup).
     * 404 when the reservation does not exist.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReservation(@PathVariable Long id) {
        try {
            reservationService.deleteReservation(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private java.util.Map<String, Object> errorBody(String message) {
        java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("message", message != null ? message : "Request could not be processed");
        return body;
    }

    @lombok.Data
    public static class ReservationRequest {
        private Long guestId;
        private Long roomId;
        private java.time.LocalDate checkInDate;
        private java.time.LocalDate checkOutDate;
        private Integer numberOfGuests;
        private String specialRequests;
    }

    @lombok.Data
    public static class RescheduleRequest {
        private java.time.LocalDate checkInDate;
        private java.time.LocalDate checkOutDate;
        private Integer numberOfGuests;
        private Long actingGuestId;
    }
}