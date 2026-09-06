package com.hotelmanagement.controller;

import com.hotelmanagement.model.Guest;
import com.hotelmanagement.service.GuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guests")
@RequiredArgsConstructor
public class GuestController {

    private final GuestService guestService;

    @PostMapping("/register")
    public ResponseEntity<Guest> register(@RequestBody Guest guest) {
        try {
            Guest registered = guestService.registerGuest(guest);
            return ResponseEntity.status(HttpStatus.CREATED).body(registered);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Guest> login(@RequestParam String email, @RequestParam String password) {
        try {
            Guest guest = guestService.authenticate(email, password);
            return ResponseEntity.ok(guest);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Guest> getGuest(@PathVariable Long id) {
        return guestService.getGuest(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<Guest> getGuestByEmail(@PathVariable String email) {
        return guestService.getGuestByEmail(email)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Guest> updateGuest(@PathVariable Long id, @RequestBody Guest guest) {
        guest.setId(id);
        try {
            Guest updated = guestService.updateGuest(guest);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<Guest>> getAllGuests() {
        return ResponseEntity.ok(guestService.getAllGuests());
    }

    @GetMapping("/active/list")
    public ResponseEntity<List<Guest>> getActiveGuests() {
        return ResponseEntity.ok(guestService.getAllActiveGuests());
    }

    @PostMapping("/{id}/suspend")
    public ResponseEntity<Guest> suspendGuest(@PathVariable Long id) {
        try {
            Guest guest = guestService.suspendGuest(id);
            return ResponseEntity.ok(guest);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/reactivate")
    public ResponseEntity<Guest> reactivateGuest(@PathVariable Long id) {
        try {
            Guest guest = guestService.reactivateGuest(id);
            return ResponseEntity.ok(guest);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    @PostMapping("/{id}/change-password")
    public ResponseEntity<Guest> changePassword(
            @PathVariable Long id,
            @RequestParam String currentPassword,
            @RequestParam String newPassword) {
        try {
            Guest guest = guestService.changePassword(id, currentPassword, newPassword);
            return ResponseEntity.ok(guest);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGuest(@PathVariable Long id) {
        try {
            guestService.deleteGuest(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
