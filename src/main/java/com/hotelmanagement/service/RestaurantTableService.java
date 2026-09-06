package com.hotelmanagement.service;

import com.hotelmanagement.model.DiningArea;
import com.hotelmanagement.model.RestaurantTable;
import com.hotelmanagement.model.TableReservation;
import com.hotelmanagement.model.TableReservationStatus;
import com.hotelmanagement.model.TableStatus;
import com.hotelmanagement.repository.RestaurantTableRepository;
import com.hotelmanagement.repository.TableReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RestaurantTableService {

    private final RestaurantTableRepository tableRepository;
    private final TableReservationRepository reservationRepository;

    public List<RestaurantTable> getAll() {
        return tableRepository.findAll();
    }

    public RestaurantTable getById(Long id) {
        return tableRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Table not found: " + id));
    }

    /**
     * Returns tables that:
     *  1. have capacity >= partySize
     *  2. have no active (non-cancelled) reservation on that date+timeSlot
     */
    public List<RestaurantTable> getAvailable(LocalDate date, String timeSlot, int partySize) {
        // Find table IDs that are already booked for this slot
        Set<Long> bookedTableIds = reservationRepository.findByReservationDate(date)
            .stream()
            .filter(r -> r.getTimeSlot().equals(timeSlot))
            .filter(r -> !TableReservationStatus.CANCELLED.equals(r.getStatus())
                      && !TableReservationStatus.NO_SHOW.equals(r.getStatus()))
            .filter(r -> r.getRestaurantTable() != null)
            .map(r -> r.getRestaurantTable().getId())
            .collect(Collectors.toSet());

        return tableRepository.findAll().stream()
            .filter(t -> !bookedTableIds.contains(t.getId()))
            .filter(t -> t.getCapacity() >= partySize)
            .filter(t -> !TableStatus.CLEANING.equals(t.getStatus()))
            .collect(Collectors.toList());
    }

    public RestaurantTable updateStatus(Long id, String statusStr) {
        RestaurantTable table = getById(id);
        TableStatus status = TableStatus.valueOf(statusStr.toUpperCase());
        table.setStatus(status);
        return tableRepository.save(table);
    }

    public RestaurantTable createTable(RestaurantTable table) {
        if (table.getStatus() == null) {
            table.setStatus(TableStatus.AVAILABLE);
        }
        return tableRepository.save(table);
    }

    public void deleteTable(Long id) {
        tableRepository.deleteById(id);
    }

    public RestaurantTable save(RestaurantTable table) {
        return tableRepository.save(table);
    }
}
