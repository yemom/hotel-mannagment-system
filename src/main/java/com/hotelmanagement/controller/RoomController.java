package com.hotelmanagement.controller;

import com.hotelmanagement.model.Room;
import com.hotelmanagement.model.RoomStatus;
import com.hotelmanagement.model.RoomType;
import com.hotelmanagement.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<Room> createRoom(@RequestBody Room room) {
        try {
            Room created = roomService.createRoom(room);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoom(@PathVariable Long id) {
        return roomService.getRoom(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Room>> getRoomsByType(@PathVariable RoomType type) {
        return ResponseEntity.ok(roomService.getRoomsByType(type));
    }

    @GetMapping("/type/{type}/available")
    public ResponseEntity<List<Room>> getAvailableRoomsByType(@PathVariable RoomType type) {
        return ResponseEntity.ok(roomService.getAvailableRoomsByType(type));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Room>> getRoomsByStatus(@PathVariable RoomStatus status) {
        return ResponseEntity.ok(roomService.getRoomsByStatus(status));
    }

    @GetMapping("/available")
    public ResponseEntity<List<Room>> getAvailableRooms(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam Integer guests) {
        try {
            List<Room> available = roomService.getAvailableRooms(checkIn, checkOut, guests);
            return ResponseEntity.ok(available);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Room> updateRoomStatus(@PathVariable Long id, @RequestParam RoomStatus status) {
        try {
            Room updated = roomService.updateRoomStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/maintenance")
    public ResponseEntity<Room> sendToMaintenance(@PathVariable Long id) {
        try {
            Room room = roomService.sendToMaintenance(id);
            return ResponseEntity.ok(room);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/available")
    public ResponseEntity<Room> markAsAvailable(@PathVariable Long id) {
        try {
            Room room = roomService.markAsAvailable(id);
            return ResponseEntity.ok(room);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
