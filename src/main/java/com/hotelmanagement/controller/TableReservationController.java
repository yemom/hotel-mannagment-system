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
@RequestMapping({"/api/restaurant/reservations", "/restaurant/reservations"})
@RequiredArgsConstructor
public class TableReservationController {

    private final TableReservationService service;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody TableReservation reservation) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.create(reservation));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<TableReservation>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<TableReservation>> getPending() {
        return ResponseEntity.ok(service.getPending());
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

    /**
     * Re-schedules a table booking owned by the acting guest.
     * 403 when not the owner, 400 invalid input, 409 when the table is taken.
     */
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> reschedule(@PathVariable Long id, @RequestBody RescheduleRequest request) {
        try {
            return ResponseEntity.ok(service.reschedule(id, request.getReservationDate(),
                request.getTimeSlot(), request.getPartySize(), request.getActingGuestId()));
        } catch (com.hotelmanagement.exception.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(@PathVariable Long id,
                                     @RequestParam(required = false) String actingRole) {
        if (!isAuthorizedStaff(actingRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(errorBody("Only authorised staff may confirm reservations"));
        }
        try {
            return ResponseEntity.ok(service.confirm(id));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{id}/seat")
    public ResponseEntity<?> seat(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.seat(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.complete(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id,
                                    @RequestParam(required = false) Long actingGuestId) {
        try {
            TableReservation cancelled = (actingGuestId != null)
                ? service.cancelAs(id, actingGuestId)
                : service.cancel(id);
            return ResponseEntity.ok(cancelled);
        } catch (com.hotelmanagement.exception.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorBody(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{id}/no-show")
    public ResponseEntity<?> noShow(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.markNoShow(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(e.getMessage()));
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

    private boolean isAuthorizedStaff(String actingRole) {
        if (actingRole == null || actingRole.trim().isEmpty()) {
            return true;
        }
        String r = actingRole.trim().toLowerCase();
        return r.equals("admin") || r.equals("super_admin") || r.equals("manager")
            || r.equals("staff") || r.equals("receptionist") || r.equals("true");
    }

    private java.util.Map<String, Object> errorBody(String message) {
        java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("message", message != null ? message : "Request could not be processed");
        return body;
    }

    @lombok.Data
    public static class RescheduleRequest {
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate reservationDate;
        private String timeSlot;
        private Integer partySize;
        private Long actingGuestId;
    }
}
