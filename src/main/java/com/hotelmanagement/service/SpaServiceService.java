package com.hotelmanagement.service;

import com.hotelmanagement.model.SpaCategory;
import com.hotelmanagement.model.SpaService;
import com.hotelmanagement.repository.SpaServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SpaServiceService {

    private final SpaServiceRepository spaServiceRepository;

    public SpaService createService(SpaService service) {
        if (service == null) {
            throw new IllegalArgumentException("Spa service cannot be null");
        }
        if (service.getName() == null || service.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Service name is required");
        }
        if (service.getCategory() == null) {
            throw new IllegalArgumentException("Service category is required");
        }
        if (service.getPrice() == null) {
            throw new IllegalArgumentException("Price is required");
        }
        if (service.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be greater than zero");
        }
        if (service.getPrice().compareTo(new BigDecimal("5000.00")) > 0) {
            throw new IllegalArgumentException("Price cannot exceed 5000.00");
        }
        if (service.getDurationMinutes() == null) {
            throw new IllegalArgumentException("Duration is required");
        }
        if (service.getDurationMinutes() < 15) {
            throw new IllegalArgumentException("Duration must be at least 15 minutes");
        }
        if (service.getDurationMinutes() > 480) {
            throw new IllegalArgumentException("Duration cannot exceed 480 minutes (8 hours)");
        }
        if (service.getCapacity() == null) {
            service.setCapacity(1);
        }
        if (service.getCapacity() < 1) {
            throw new IllegalArgumentException("Capacity must be at least 1");
        }
        if (service.getCapacity() > 20) {
            throw new IllegalArgumentException("Capacity cannot exceed 20");
        }

        if (service.getActive() == null) {
            service.setActive(true);
        }
        service.setCreatedAt(LocalDateTime.now());
        service.setUpdatedAt(LocalDateTime.now());

        return spaServiceRepository.save(service);
    }

    public List<SpaService> getAllServices() {
        return spaServiceRepository.findAll();
    }

    public List<SpaService> getActiveServices() {
        return spaServiceRepository.findByActiveTrue();
    }

    public Optional<SpaService> getServiceById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        return spaServiceRepository.findById(id);
    }

    public List<SpaService> getServicesByCategory(SpaCategory category) {
        if (category == null) {
            throw new IllegalArgumentException("Category cannot be null");
        }
        return spaServiceRepository.findByCategoryAndActiveTrue(category);
    }

    public SpaService updateService(Long id, SpaService updated) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        if (updated == null) {
            throw new IllegalArgumentException("Updated spa service cannot be null");
        }

        SpaService existing = spaServiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Spa service not found with ID: " + id));

        if (updated.getName() != null) {
            if (updated.getName().trim().isEmpty()) {
                throw new IllegalArgumentException("Service name cannot be empty");
            }
            existing.setName(updated.getName().trim());
        }
        if (updated.getDescription() != null) {
            existing.setDescription(updated.getDescription());
        }
        if (updated.getCategory() != null) {
            existing.setCategory(updated.getCategory());
        }
        if (updated.getPrice() != null) {
            if (updated.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Price must be greater than zero");
            }
            if (updated.getPrice().compareTo(new BigDecimal("5000.00")) > 0) {
                throw new IllegalArgumentException("Price cannot exceed 5000.00");
            }
            existing.setPrice(updated.getPrice());
        }
        if (updated.getDurationMinutes() != null) {
            if (updated.getDurationMinutes() < 15) {
                throw new IllegalArgumentException("Duration must be at least 15 minutes");
            }
            if (updated.getDurationMinutes() > 480) {
                throw new IllegalArgumentException("Duration cannot exceed 480 minutes (8 hours)");
            }
            existing.setDurationMinutes(updated.getDurationMinutes());
        }
        if (updated.getCapacity() != null) {
            if (updated.getCapacity() < 1) {
                throw new IllegalArgumentException("Capacity must be at least 1");
            }
            if (updated.getCapacity() > 20) {
                throw new IllegalArgumentException("Capacity cannot exceed 20");
            }
            existing.setCapacity(updated.getCapacity());
        }
        if (updated.getImageUrl() != null) {
            existing.setImageUrl(updated.getImageUrl());
        }
        if (updated.getActive() != null) {
            existing.setActive(updated.getActive());
        }

        existing.setUpdatedAt(LocalDateTime.now());
        return spaServiceRepository.save(existing);
    }

    public SpaService deactivateService(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        SpaService existing = spaServiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Spa service not found with ID: " + id));
        existing.setActive(false);
        existing.setUpdatedAt(LocalDateTime.now());
        return spaServiceRepository.save(existing);
    }

    public SpaService activateService(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        SpaService existing = spaServiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Spa service not found with ID: " + id));
        existing.setActive(true);
        existing.setUpdatedAt(LocalDateTime.now());
        return spaServiceRepository.save(existing);
    }

    public void deleteService(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        SpaService existing = spaServiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Spa service not found with ID: " + id));
        // Soft delete preference
        existing.setActive(false);
        existing.setUpdatedAt(LocalDateTime.now());
        spaServiceRepository.save(existing);
    }
}
