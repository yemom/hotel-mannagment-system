package com.hotelmanagement.service;

import com.hotelmanagement.model.Guest;
import com.hotelmanagement.model.RestaurantTable;
import com.hotelmanagement.model.TableReservation;
import com.hotelmanagement.model.TableReservationStatus;
import com.hotelmanagement.repository.GuestRepository;
import com.hotelmanagement.repository.RestaurantTableRepository;
import com.hotelmanagement.repository.TableReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TableReservationService {

    private final TableReservationRepository repository;
    private final GuestRepository guestRepository;
    private final RestaurantTableRepository tableRepository;

    public TableReservation create(TableReservation reservation) {
        if (reservation.getReservationDate() == null) {
            throw new IllegalArgumentException("Reservation date is required");
        }
        if (reservation.getTimeSlot() == null || reservation.getTimeSlot().isBlank()) {
            throw new IllegalArgumentException("Time slot is required");
        }
        if (reservation.getPartySize() == null || reservation.getPartySize() < 1) {
            throw new IllegalArgumentException("Party size must be at least 1");
        }
        if (reservation.getPartySize() > 20) {
            throw new IllegalArgumentException("Party size cannot exceed 20");
        }
        if (reservation.getGuest() == null || reservation.getGuest().getId() == null) {
            throw new IllegalArgumentException("Guest is required");
        }

        Guest guest = guestRepository.findById(reservation.getGuest().getId())
            .orElseThrow(() -> new IllegalArgumentException("Guest not found: " + reservation.getGuest().getId()));
        reservation.setGuest(guest);

        if (reservation.getRestaurantTable() != null && reservation.getRestaurantTable().getId() != null) {
            RestaurantTable table = tableRepository.findById(reservation.getRestaurantTable().getId())
                .orElseThrow(() -> new IllegalArgumentException("Table not found: " + reservation.getRestaurantTable().getId()));
            reservation.setRestaurantTable(table);
        }

        reservation.setStatus(TableReservationStatus.PENDING);
        reservation.setCreatedAt(LocalDateTime.now());
        return repository.save(reservation);
    }

    public List<TableReservation> getAll() {
        return repository.findAll();
    }

    public TableReservation getById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Table reservation not found: " + id));
    }

    public List<TableReservation> getByGuestId(Long guestId) {
        return repository.findByGuestId(guestId);
    }

    public List<TableReservation> getByDate(LocalDate date) {
        return repository.findByReservationDate(date);
    }

    public TableReservation confirm(Long id) {
        TableReservation res = getById(id);
        res.confirm();
        return repository.save(res);
    }

    public TableReservation seat(Long id) {
        TableReservation res = getById(id);
        res.seat();
        // Mark the physical table as OCCUPIED
        if (res.getRestaurantTable() != null) {
            res.getRestaurantTable().setStatus(
                com.hotelmanagement.model.TableStatus.OCCUPIED);
        }
        return repository.save(res);
    }

    public TableReservation complete(Long id) {
        TableReservation res = getById(id);
        res.complete();
        // Free up the physical table
        if (res.getRestaurantTable() != null) {
            res.getRestaurantTable().setStatus(
                com.hotelmanagement.model.TableStatus.AVAILABLE);
        }
        return repository.save(res);
    }

    public TableReservation cancel(Long id) {
        TableReservation res = getById(id);
        res.cancel();
        if (res.getRestaurantTable() != null) {
            res.getRestaurantTable().setStatus(
                com.hotelmanagement.model.TableStatus.AVAILABLE);
        }
        return repository.save(res);
    }

    public TableReservation markNoShow(Long id) {
        TableReservation res = getById(id);
        res.markNoShow();
        if (res.getRestaurantTable() != null) {
            res.getRestaurantTable().setStatus(
                com.hotelmanagement.model.TableStatus.AVAILABLE);
        }
        return repository.save(res);
    }

    public void delete(Long id) {
        TableReservation res = repository.findById(id).orElse(null);
        if (res != null) {
            if (res.getRestaurantTable() != null && TableReservationStatus.SEATED.equals(res.getStatus())) {
                res.getRestaurantTable().setStatus(com.hotelmanagement.model.TableStatus.AVAILABLE);
                tableRepository.save(res.getRestaurantTable());
            }
            repository.delete(res);
        }
    }
}
