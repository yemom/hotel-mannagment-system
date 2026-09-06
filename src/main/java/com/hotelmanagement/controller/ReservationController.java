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
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;
    private final GuestRepository guestRepository;
    private final RoomRepository roomRepository;

    @PostMapping
    public ResponseEntity<Reservation> createReservation(@RequestBody ReservationRequest request) {
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
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

    @PostMapping("/{id}/confirm")
    public ResponseEntity<Reservation> confirmReservation(@PathVariable Long id) {
        try {
            Reservation confirmed = reservationService.confirmReservation(id);
            return ResponseEntity.ok(confirmed);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/check-in")
    public ResponseEntity<Reservation> checkIn(@PathVariable Long id) {
        try {
            Reservation checkedIn = reservationService.checkIn(id);
            return ResponseEntity.ok(checkedIn);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{id}/check-out")
    public ResponseEntity<Reservation> checkOut(@PathVariable Long id) {
        try {
            Reservation checkedOut = reservationService.checkOut(id);
            return ResponseEntity.ok(checkedOut);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Reservation> cancelReservation(@PathVariable Long id) {
        try {
            Reservation cancelled = reservationService.cancelReservation(id);
            return ResponseEntity.ok(cancelled);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
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
}
