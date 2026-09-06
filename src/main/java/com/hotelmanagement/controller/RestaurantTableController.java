package com.hotelmanagement.controller;

import com.hotelmanagement.model.RestaurantTable;
import com.hotelmanagement.service.RestaurantTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/restaurant/tables")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class RestaurantTableController {

    private final RestaurantTableService tableService;

    @GetMapping
    public ResponseEntity<List<RestaurantTable>> getAll() {
        return ResponseEntity.ok(tableService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantTable> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(tableService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Returns tables available for a given date, timeSlot, and partySize.
     * Example: GET /api/restaurant/tables/available?date=2026-09-10&timeSlot=18:00&partySize=2
     */
    @GetMapping("/available")
    public ResponseEntity<List<RestaurantTable>> getAvailable(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String timeSlot,
            @RequestParam(defaultValue = "1") int partySize) {
        return ResponseEntity.ok(tableService.getAvailable(date, timeSlot, partySize));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<RestaurantTable> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            return ResponseEntity.ok(tableService.updateStatus(id, status));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping
    public ResponseEntity<RestaurantTable> createTable(@RequestBody RestaurantTable table) {
        try {
            RestaurantTable created = tableService.createTable(table);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTable(@PathVariable Long id) {
        try {
            tableService.deleteTable(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
