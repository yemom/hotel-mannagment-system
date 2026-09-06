package com.hotelmanagement.service;

import com.hotelmanagement.model.Room;
import com.hotelmanagement.model.RoomStatus;
import com.hotelmanagement.model.RoomType;
import com.hotelmanagement.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final PricingService pricingService;

    /**
     * Create a new room.
     */
    public Room createRoom(Room room) {
        if (!isValidRoom(room)) {
            throw new IllegalArgumentException("Invalid room data");
        }
        room.setStatus(RoomStatus.AVAILABLE);
        return roomRepository.save(room);
    }

    /**
     * Update room status.
     */
    public Room updateRoomStatus(Long roomId, RoomStatus status) {
        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        room.setStatus(status);
        return roomRepository.save(room);
    }

    /**
     * Get available rooms for a date range and guest count.
     */
    public List<Room> getAvailableRooms(LocalDate checkIn, LocalDate checkOut, Integer guestCount) {
        if (!isValidDateRange(checkIn, checkOut)) {
            throw new IllegalArgumentException("Invalid date range");
        }
        if (!isValidGuestCount(guestCount)) {
            throw new IllegalArgumentException("Invalid guest count");
        }

        List<Room> allRooms = roomRepository.findByStatus(RoomStatus.AVAILABLE);
        return allRooms.stream()
            .filter(room -> room.canAccommodate(guestCount))
            .collect(Collectors.toList());
    }

    /**
     * Get rooms by type.
     */
    public List<Room> getRoomsByType(RoomType roomType) {
        return roomRepository.findByRoomType(roomType);
    }

    /**
     * Get available rooms by type.
     */
    public List<Room> getAvailableRoomsByType(RoomType roomType) {
        return roomRepository.findByRoomTypeAndStatus(roomType, RoomStatus.AVAILABLE);
    }

    /**
     * Get room by ID.
     */
    public Optional<Room> getRoom(Long id) {
        return roomRepository.findById(id);
    }

    /**
     * Get room by number.
     */
    public Optional<Room> getRoomByNumber(String roomNumber) {
        return roomRepository.findByRoomNumber(roomNumber);
    }

    /**
     * Get all rooms.
     */
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    /**
     * Get rooms by status.
     */
    public List<Room> getRoomsByStatus(RoomStatus status) {
        return roomRepository.findByStatus(status);
    }

    /**
     * Send room to maintenance.
     */
    public Room sendToMaintenance(Long roomId) {
        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        room.setStatus(RoomStatus.MAINTENANCE);
        return roomRepository.save(room);
    }

    /**
     * Mark room as available after maintenance.
     */
    public Room markAsAvailable(Long roomId) {
        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        room.setStatus(RoomStatus.AVAILABLE);
        return roomRepository.save(room);
    }

    private boolean isValidRoom(Room room) {
        return room.getRoomNumber() != null && !room.getRoomNumber().isEmpty()
            && room.getRoomType() != null
            && room.getBasePrice() != null
            && pricingService.isValidPrice(room.getBasePrice())
            && room.getCapacity() != null && room.getCapacity() > 0;
    }

    private boolean isValidDateRange(LocalDate checkIn, LocalDate checkOut) {
        return checkIn != null && checkOut != null && checkOut.isAfter(checkIn);
    }

    private boolean isValidGuestCount(Integer guestCount) {
        return guestCount != null && guestCount > 0 && guestCount <= 20;
    }
}
