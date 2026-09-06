package com.hotelmanagement.repository;

import com.hotelmanagement.model.Guest;
import com.hotelmanagement.model.GuestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuestRepository extends JpaRepository<Guest, Long> {
    Optional<Guest> findByEmail(String email);
    List<Guest> findByStatus(GuestStatus status);
}
