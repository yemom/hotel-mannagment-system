package com.hotelmanagement.controller;

import com.hotelmanagement.model.SpaCategory;
import com.hotelmanagement.model.SpaService;
import com.hotelmanagement.service.SpaServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/spa-services", "/spa-services", "/api/spa/services", "/spa/services"})
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class SpaServiceController {

    private final SpaServiceService spaServiceService;

    @GetMapping
    public ResponseEntity<List<SpaService>> getAllServices(
            @RequestParam(required = false) Boolean activeOnly) {
        if (Boolean.TRUE.equals(activeOnly)) {
            return ResponseEntity.ok(spaServiceService.getActiveServices());
        }
        return ResponseEntity.ok(spaServiceService.getAllServices());
    }

    @GetMapping("/active")
    public ResponseEntity<List<SpaService>> getActiveServices() {
        return ResponseEntity.ok(spaServiceService.getActiveServices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SpaService> getServiceById(@PathVariable Long id) {
        return spaServiceService.getServiceById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<SpaService>> getServicesByCategory(@PathVariable SpaCategory category) {
        try {
            return ResponseEntity.ok(spaServiceService.getServicesByCategory(category));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createService(@RequestBody SpaService service) {
        try {
            SpaService created = spaServiceService.createService(service);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateService(@PathVariable Long id, @RequestBody SpaService service) {
        try {
            SpaService updated = spaServiceService.updateService(id, service);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        try {
            spaServiceService.deleteService(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateService(@PathVariable Long id) {
        try {
            SpaService updated = spaServiceService.deactivateService(id);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<?> activateService(@PathVariable Long id) {
        try {
            SpaService updated = spaServiceService.activateService(id);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
