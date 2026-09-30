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

        // Reject a table that cannot seat the party, or is already booked for that slot.
        if (reservation.getRestaurantTable() != null) {
            RestaurantTable assigned = reservation.getRestaurantTable();
            if (assigned.getCapacity() != null && reservation.getPartySize() > assigned.getCapacity()) {
                throw new IllegalArgumentException("Table " + assigned.getTableNumber()
                    + " seats at most " + assigned.getCapacity() + " guests");
            }
            assertNoTableConflict(assigned.getId(), reservation.getReservationDate(),
                reservation.getTimeSlot(), null);
        }

        reservation.setStatus(TableReservationStatus.PENDING);
        reservation.setCreatedAt(LocalDateTime.now());
        return repository.save(reservation);
    }

    /**
     * Re-schedules an existing table reservation owned by the acting guest.
     *
     * Server-side validation:
     *  - ownership (mismatch -> AccessDeniedException / 403)
     *  - only PENDING or CONFIRMED may change
     *  - date must not be in the past, time slot must be a valid HH:mm
     *  - party size must be 1..20 and fit the table capacity
     *  - the table must not already be booked for that date + time slot
     *  - status returns to PENDING so staff re-approve the change
     */
    public TableReservation reschedule(Long id, LocalDate newDate, String newTimeSlot,
                                       Integer newPartySize, Long actingGuestId) {
        TableReservation res = getById(id);

        requireOwnership(res.getGuest() != null ? res.getGuest().getId() : null, actingGuestId);

        if (!TableReservationStatus.PENDING.equals(res.getStatus())
            && !TableReservationStatus.CONFIRMED.equals(res.getStatus())) {
            throw new IllegalStateException(
                "Cannot modify a reservation with status: " + res.getStatus());
        }

        if (newDate == null) {
            throw new IllegalArgumentException("Reservation date is required");
        }
        if (newDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Reservation date cannot be in the past");
        }
        if (newTimeSlot == null || !newTimeSlot.trim().matches("^([01][0-9]|2[0-3]):[0-5][0-9]$")) {
            throw new IllegalArgumentException("Time slot must be in HH:mm format (e.g. 18:00)");
        }

        int partySize = newPartySize != null ? newPartySize : res.getPartySize();
        if (partySize < 1 || partySize > 20) {
            throw new IllegalArgumentException("Party size must be between 1 and 20");
        }

        RestaurantTable table = res.getRestaurantTable();
        if (table != null && table.getCapacity() != null && partySize > table.getCapacity()) {
            throw new IllegalArgumentException("Table " + table.getTableNumber()
                + " seats at most " + table.getCapacity() + " guests");
        }

        if (table != null && table.getId() != null) {
            List<TableReservation> conflicts =
                repository.findByRestaurantTableIdAndReservationDateAndTimeSlotAndStatusNotAndIdNot(
                    table.getId(), newDate, newTimeSlot, TableReservationStatus.CANCELLED, res.getId());
            if (!conflicts.isEmpty()) {
                throw new IllegalStateException("Table " + table.getTableNumber()
                    + " is already reserved for " + newTimeSlot + " on " + newDate);
            }
        }

        res.setReservationDate(newDate);
        res.setTimeSlot(newTimeSlot);
        res.setPartySize(partySize);
        res.setStatus(TableReservationStatus.PENDING);
        return repository.save(res);
    }

    /**
     * Cancels a reservation on behalf of a specific guest, enforcing ownership.
     */
    public TableReservation cancelAs(Long id, Long actingGuestId) {
        TableReservation res = getById(id);
        requireOwnership(res.getGuest() != null ? res.getGuest().getId() : null, actingGuestId);
        return cancel(id);
    }

    /**
     * Admin queue: table reservations still awaiting approval.
     */
    public List<TableReservation> getPending() {
        return repository.findByStatus(TableReservationStatus.PENDING);
    }

    private void requireOwnership(Long ownerGuestId, Long actingGuestId) {
        if (actingGuestId == null) {
            throw new IllegalArgumentException("actingGuestId is required");
        }
        if (ownerGuestId == null || !ownerGuestId.equals(actingGuestId)) {
            throw new com.hotelmanagement.exception.AccessDeniedException(
                "You may only modify your own reservations");
        }
    }

    /**
     * Rejects a create/reschedule that would double-book the same table, date and slot.
     */
    private void assertNoTableConflict(Long tableId, LocalDate date, String timeSlot, Long excludeId) {
        if (tableId == null || date == null || timeSlot == null) {
            return;
        }
        List<TableReservation> conflicts;
        if (excludeId == null) {
            conflicts = repository.findByRestaurantTableIdAndReservationDateAndTimeSlot(
                tableId, date, timeSlot);
            conflicts = conflicts.stream()
                .filter(r -> !TableReservationStatus.CANCELLED.equals(r.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        } else {
            conflicts = repository.findByRestaurantTableIdAndReservationDateAndTimeSlotAndStatusNotAndIdNot(
                tableId, date, timeSlot, TableReservationStatus.CANCELLED, excludeId);
        }
        if (!conflicts.isEmpty()) {
            throw new IllegalStateException("That table is already reserved for "
                + timeSlot + " on " + date);
        }
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
