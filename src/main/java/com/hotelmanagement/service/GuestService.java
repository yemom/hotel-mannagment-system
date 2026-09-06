package com.hotelmanagement.service;

import com.hotelmanagement.model.Guest;
import com.hotelmanagement.model.GuestStatus;
import com.hotelmanagement.repository.GuestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GuestService {

    private final GuestRepository guestRepository;

    @org.springframework.beans.factory.annotation.Value("${superadmin.email:12yemom@gmail.com}")
    private String superAdminEmail;

    @org.springframework.beans.factory.annotation.Value("${superadmin.password:12345678}")
    private String superAdminPassword;

    @org.springframework.beans.factory.annotation.Value("${superadmin.firstName:Yemom}")
    private String superAdminFirstName;

    @org.springframework.beans.factory.annotation.Value("${superadmin.lastName:Admin}")
    private String superAdminLastName;

    @org.springframework.beans.factory.annotation.Value("${superadmin.phone:+251934046279}")
    private String superAdminPhone;

    /**
     * Register a new guest.
     */
    public Guest registerGuest(Guest guest) {
        // Validate
        if (!isValidEmail(guest.getEmail())) {
            throw new IllegalArgumentException("Invalid email format");
        }
        if (guest.getPassword() == null || guest.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        if (!guest.isValidAge()) {
            throw new IllegalArgumentException("Age must be between 18 and 120");
        }

        // Check if email already exists
        if (guestRepository.findByEmail(guest.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        guest.setStatus(GuestStatus.ACTIVE);
        return guestRepository.save(guest);
    }

    /**
     * Authenticate guest login.
     */
    public Guest authenticate(String email, String password) {
        if (email == null || password == null) {
            throw new IllegalArgumentException("Email and password are required");
        }
        String cleanEmail = email.trim();
        Optional<Guest> guest = guestRepository.findByEmail(cleanEmail);
        if (guest.isEmpty()) {
            guest = guestRepository.findByEmail(cleanEmail.toLowerCase());
        }
        if (guest.isEmpty()) {
            guest = guestRepository.findAll().stream()
                .filter(g -> g.getEmail() != null && g.getEmail().equalsIgnoreCase(cleanEmail))
                .findFirst();
        }

        boolean isSuperAdmin = cleanEmail.equalsIgnoreCase(superAdminEmail) ||
                               cleanEmail.equalsIgnoreCase("12yemom@gmail.com") ||
                               cleanEmail.equalsIgnoreCase("12yemom@gamail.com");

        if (guest.isEmpty() && isSuperAdmin && superAdminPassword.equals(password)) {
            Guest autoAdmin = Guest.builder()
                .firstName(superAdminFirstName)
                .lastName(superAdminLastName)
                .email(cleanEmail)
                .password(superAdminPassword)
                .phone(superAdminPhone)
                .age(30)
                .address("የ-mom Hotel HQ")
                .city("Addis Ababa")
                .country("Ethiopia")
                .status(GuestStatus.ACTIVE)
                .build();
            return guestRepository.save(autoAdmin);
        }

        if (guest.isEmpty()) {
            throw new IllegalArgumentException("Guest not found with email: " + cleanEmail);
        }

        Guest g = guest.get();
        if (!password.equals(g.getPassword())) { // In production, use BCrypt
            throw new IllegalArgumentException("Invalid password for guest");
        }

        if (!GuestStatus.ACTIVE.equals(g.getStatus())) {
            if (isSuperAdmin) {
                g.setStatus(GuestStatus.ACTIVE);
                guestRepository.save(g);
            } else {
                throw new IllegalArgumentException("Account is not active");
            }
        }

        return g;
    }

    /**
     * Update guest profile.
     */
    public Guest updateGuest(Guest guest) {
        if (guest.getId() == null) {
            throw new IllegalArgumentException("Guest ID is required");
        }

        Guest existing = guestRepository.findById(guest.getId())
            .orElseThrow(() -> new IllegalArgumentException("Guest not found"));

        if (guest.getFirstName() != null) {
            existing.setFirstName(guest.getFirstName());
        }
        if (guest.getLastName() != null) {
            existing.setLastName(guest.getLastName());
        }
        if (guest.getPhone() != null) {
            existing.setPhone(guest.getPhone());
        }
        if (guest.getAge() != null) {
            if (!isValidAge(guest.getAge())) {
                throw new IllegalArgumentException("Invalid age");
            }
            existing.setAge(guest.getAge());
        }
        if (guest.getAddress() != null) {
            existing.setAddress(guest.getAddress());
        }
        if (guest.getCity() != null) {
            existing.setCity(guest.getCity());
        }
        if (guest.getCountry() != null) {
            existing.setCountry(guest.getCountry());
        }

        return guestRepository.save(existing);
    }

    /**
     * Change guest password (requires current password for verification).
     */
    public Guest changePassword(Long guestId, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters");
        }

        Guest existing = guestRepository.findById(guestId)
            .orElseThrow(() -> new IllegalArgumentException("Guest not found"));

        if (!currentPassword.equals(existing.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        existing.setPassword(newPassword);
        return guestRepository.save(existing);
    }

    /**
     * Suspend a guest account.
     */
    public Guest suspendGuest(Long guestId) {
        Guest guest = guestRepository.findById(guestId)
            .orElseThrow(() -> new IllegalArgumentException("Guest not found"));
        guest.setStatus(GuestStatus.SUSPENDED);
        return guestRepository.save(guest);
    }

    /**
     * Reactivate a guest account.
     */
    public Guest reactivateGuest(Long guestId) {
        Guest guest = guestRepository.findById(guestId)
            .orElseThrow(() -> new IllegalArgumentException("Guest not found"));
        guest.setStatus(GuestStatus.ACTIVE);
        return guestRepository.save(guest);
    }

    /**
     * Get guest by ID.
     */
    public Optional<Guest> getGuest(Long id) {
        return guestRepository.findById(id);
    }

    /**
     * Get guest by email.
     */
    public Optional<Guest> getGuestByEmail(String email) {
        return guestRepository.findByEmail(email);
    }

    private boolean isSuperAdminOrStaffEmail(String email) {
        if (email == null) return false;
        String lower = email.trim().toLowerCase();
        return lower.equals("12yemom@gmail.com") ||
               lower.equals("12yemom@gamail.com") ||
               lower.startsWith("12yemom@") ||
               (superAdminEmail != null && lower.equals(superAdminEmail.trim().toLowerCase()));
    }

    /**
     * Get all guests (excluding Super Admin / Staff).
     */
    public List<Guest> getAllGuests() {
        return guestRepository.findAll().stream()
            .filter(g -> !isSuperAdminOrStaffEmail(g.getEmail()))
            .collect(Collectors.toList());
    }

    /**
     * Get all active guests (excluding Super Admin / Staff).
     */
    public List<Guest> getAllActiveGuests() {
        return guestRepository.findByStatus(GuestStatus.ACTIVE).stream()
            .filter(g -> !isSuperAdminOrStaffEmail(g.getEmail()))
            .collect(Collectors.toList());
    }

    /**
     * Delete a guest account.
     */
    public void deleteGuest(Long guestId) {
        Guest guest = guestRepository.findById(guestId)
            .orElseThrow(() -> new IllegalArgumentException("Guest not found"));
        guestRepository.delete(guest);
    }

    private boolean isValidEmail(String email) {
        return email != null && email.contains("@") && email.contains(".");
    }

    private boolean isValidAge(Integer age) {
        return age != null && age >= 18 && age <= 120;
    }
}
