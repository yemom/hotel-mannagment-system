package com.hotelmanagement.controller;

import com.hotelmanagement.model.TableReservation;
import com.hotelmanagement.service.TableReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/restaurant/reservations")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class TableReservationController {

    private final TableReservationService service;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody TableReservation reservation) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.create(reservation));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", e.getMessage() != null ? e.getMessage() : "Invalid reservation"));
        }
    }

    @GetMapping
    public ResponseEntity<List<TableReservation>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TableReservation> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/guest/{guestId}")
    public ResponseEntity<List<TableReservation>> getByGuest(@PathVariable Long guestId) {
        return ResponseEntity.ok(service.getByGuestId(guestId));
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<TableReservation>> getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.getByDate(date));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<TableReservation> confirm(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.confirm(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{id}/seat")
    public ResponseEntity<TableReservation> seat(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.seat(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<TableReservation> complete(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.complete(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<TableReservation> cancel(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.cancel(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{id}/no-show")
    public ResponseEntity<TableReservation> noShow(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.markNoShow(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
