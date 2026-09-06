package com.hotelmanagement.service;

import com.hotelmanagement.model.Guest;
import com.hotelmanagement.model.GuestStatus;
import com.hotelmanagement.repository.GuestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GuestService using test doubles (mocks).
 * Tests guest registration, authentication, and profile management.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GuestService Unit Tests")
class GuestServiceTest {

    private GuestService guestService;

    @Mock
    private GuestRepository guestRepository;

    @BeforeEach
    void setUp() {
        guestService = new GuestService(guestRepository);
    }

    // ===== Equivalence Partitioning Tests: Age Ranges =====

    @Test
    @DisplayName("Should register guest with valid age in young adult range (18-25)")
    void testRegisterGuestYoungAdult() {
        // Arrange
        Guest guest = Guest.builder()
            .firstName("John")
            .lastName("Doe")
            .email("john@example.com")
            .password("password123")
            .phone("1234567890")
            .age(22)
            .build();

        when(guestRepository.findByEmail("john@example.com")).thenReturn(Optional.empty());
        when(guestRepository.save(any(Guest.class))).thenReturn(guest);

        // Act
        Guest result = guestService.registerGuest(guest);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(GuestStatus.ACTIVE);
        verify(guestRepository, times(1)).save(any(Guest.class));
    }

    @Test
    @DisplayName("Should register guest with valid age in middle-aged range (40-60)")
    void testRegisterGuestMiddleAged() {
        // Arrange
        Guest guest = Guest.builder()
            .firstName("Jane")
            .lastName("Smith")
            .email("jane@example.com")
            .password("password123")
            .phone("1234567890")
            .age(50)
            .build();

        when(guestRepository.findByEmail("jane@example.com")).thenReturn(Optional.empty());
        when(guestRepository.save(any(Guest.class))).thenReturn(guest);

        // Act
        Guest result = guestService.registerGuest(guest);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(GuestStatus.ACTIVE);
    }

    @Test
    @DisplayName("Should register guest with valid age in senior range (60-120)")
    void testRegisterGuestSenior() {
        // Arrange
        Guest guest = Guest.builder()
            .firstName("Bob")
            .lastName("Johnson")
            .email("bob@example.com")
            .password("password123")
            .phone("1234567890")
            .age(75)
            .build();

        when(guestRepository.findByEmail("bob@example.com")).thenReturn(Optional.empty());
        when(guestRepository.save(any(Guest.class))).thenReturn(guest);

        // Act
        Guest result = guestService.registerGuest(guest);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(GuestStatus.ACTIVE);
    }

    // ===== Boundary Value Analysis: Age =====

    @Test
    @DisplayName("Should register guest at minimum valid age boundary (18)")
    void testRegisterGuestMinimumAge() {
        // Arrange
        Guest guest = Guest.builder()
            .firstName("Young")
            .lastName("Adult")
            .email("young@example.com")
            .password("password123")
            .phone("1234567890")
            .age(18)
            .build();

        when(guestRepository.findByEmail("young@example.com")).thenReturn(Optional.empty());
        when(guestRepository.save(any(Guest.class))).thenReturn(guest);

        // Act & Assert
        assertThatNoException().isThrownBy(() -> guestService.registerGuest(guest));
    }

    @Test
    @DisplayName("Should register guest at maximum valid age boundary (120)")
    void testRegisterGuestMaximumAge() {
        // Arrange
        Guest guest = Guest.builder()
            .firstName("Old")
            .lastName("Person")
            .email("old@example.com")
            .password("password123")
            .phone("1234567890")
            .age(120)
            .build();

        when(guestRepository.findByEmail("old@example.com")).thenReturn(Optional.empty());
        when(guestRepository.save(any(Guest.class))).thenReturn(guest);

        // Act & Assert
        assertThatNoException().isThrownBy(() -> guestService.registerGuest(guest));
    }

    @Test
    @DisplayName("Should reject guest below minimum age boundary (17)")
    void testRegisterGuestBelowMinimumAge() {
        // Arrange
        Guest guest = Guest.builder()
            .firstName("Child")
            .lastName("Person")
            .email("child@example.com")
            .password("password123")
            .phone("1234567890")
            .age(17)
            .build();

        // Act & Assert
        assertThatThrownBy(() -> guestService.registerGuest(guest))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Age must be between 18 and 120");
    }

    @Test
    @DisplayName("Should reject guest above maximum age boundary (121)")
    void testRegisterGuestAboveMaximumAge() {
        // Arrange
        Guest guest = Guest.builder()
            .firstName("Ancient")
            .lastName("Person")
            .email("ancient@example.com")
            .password("password123")
            .phone("1234567890")
            .age(121)
            .build();

        // Act & Assert
        assertThatThrownBy(() -> guestService.registerGuest(guest))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Age must be between 18 and 120");
    }

    // ===== Password Validation Tests =====

    @ParameterizedTest
    @ValueSource(strings = {"123456", "password", "qwerty1", "MyP@ss1"})
    @DisplayName("Should register guest with valid password lengths (6+ characters)")
    void testRegisterGuestValidPasswords(String password) {
        // Arrange
        Guest guest = Guest.builder()
            .firstName("John")
            .lastName("Doe")
            .email("john" + password + "@example.com")
            .password(password)
            .phone("1234567890")
            .age(30)
            .build();

        when(guestRepository.findByEmail(guest.getEmail())).thenReturn(Optional.empty());
        when(guestRepository.save(any(Guest.class))).thenReturn(guest);

        // Act & Assert
        assertThatNoException().isThrownBy(() -> guestService.registerGuest(guest));
    }

    @Test
    @DisplayName("Should reject guest with password less than 6 characters")
    void testRegisterGuestShortPassword() {
        // Arrange
        Guest guest = Guest.builder()
            .firstName("John")
            .lastName("Doe")
            .email("john@example.com")
            .password("123")
            .phone("1234567890")
            .age(30)
            .build();

        // Act & Assert
        assertThatThrownBy(() -> guestService.registerGuest(guest))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Password must be at least 6 characters");
    }

    @Test
    @DisplayName("Should reject guest with null password")
    void testRegisterGuestNullPassword() {
        // Arrange
        Guest guest = Guest.builder()
            .firstName("John")
            .lastName("Doe")
            .email("john@example.com")
            .password(null)
            .phone("1234567890")
            .age(30)
            .build();

        // Act & Assert
        assertThatThrownBy(() -> guestService.registerGuest(guest))
            .isInstanceOf(IllegalArgumentException.class);
    }

    // ===== Authentication Tests =====

    @Test
    @DisplayName("Should authenticate guest with correct credentials")
    void testAuthenticateGuestSuccess() {
        // Arrange
        Guest guest = Guest.builder()
            .id(1L)
            .firstName("John")
            .lastName("Doe")
            .email("john@example.com")
            .password("password123")
            .phone("1234567890")
            .age(30)
            .status(GuestStatus.ACTIVE)
            .build();

        when(guestRepository.findByEmail("john@example.com")).thenReturn(Optional.of(guest));

        // Act
        Guest result = guestService.authenticate("john@example.com", "password123");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("john@example.com");
    }

    @Test
    @DisplayName("Should reject authentication with incorrect password")
    void testAuthenticateGuestWrongPassword() {
        // Arrange
        Guest guest = Guest.builder()
            .id(1L)
            .firstName("John")
            .lastName("Doe")
            .email("john@example.com")
            .password("password123")
            .phone("1234567890")
            .age(30)
            .status(GuestStatus.ACTIVE)
            .build();

        when(guestRepository.findByEmail("john@example.com")).thenReturn(Optional.of(guest));

        // Act & Assert
        assertThatThrownBy(() -> guestService.authenticate("john@example.com", "wrongpassword"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid password");
    }

    @Test
    @DisplayName("Should reject authentication for non-existent guest")
    void testAuthenticateNonExistentGuest() {
        // Arrange
        when(guestRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> guestService.authenticate("unknown@example.com", "password"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Guest not found");
    }

    @Test
    @DisplayName("Should reject authentication for suspended guest account")
    void testAuthenticateSuspendedGuest() {
        // Arrange
        Guest guest = Guest.builder()
            .id(1L)
            .firstName("John")
            .lastName("Doe")
            .email("john@example.com")
            .password("password123")
            .phone("1234567890")
            .age(30)
            .status(GuestStatus.SUSPENDED)
            .build();

        when(guestRepository.findByEmail("john@example.com")).thenReturn(Optional.of(guest));

        // Act & Assert
        assertThatThrownBy(() -> guestService.authenticate("john@example.com", "password123"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("not active");
    }

    // ===== Email Validation Tests =====

    @Test
    @DisplayName("Should reject registration with duplicate email")
    void testRegisterGuestDuplicateEmail() {
        // Arrange
        Guest existingGuest = Guest.builder()
            .id(1L)
            .firstName("Existing")
            .lastName("User")
            .email("duplicate@example.com")
            .password("password123")
            .phone("1234567890")
            .age(30)
            .build();

        Guest newGuest = Guest.builder()
            .firstName("New")
            .lastName("User")
            .email("duplicate@example.com")
            .password("password123")
            .phone("0987654321")
            .age(25)
            .build();

        when(guestRepository.findByEmail("duplicate@example.com")).thenReturn(Optional.of(existingGuest));

        // Act & Assert
        assertThatThrownBy(() -> guestService.registerGuest(newGuest))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Email already registered");
    }

    @Test
    @DisplayName("Should reject registration with invalid email format")
    void testRegisterGuestInvalidEmail() {
        // Arrange
        Guest guest = Guest.builder()
            .firstName("John")
            .lastName("Doe")
            .email("invalidemail")
            .password("password123")
            .phone("1234567890")
            .age(30)
            .build();

        // Act & Assert
        assertThatThrownBy(() -> guestService.registerGuest(guest))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid email");
    }

    // ===== Guest Profile Update Tests =====

    @Test
    @DisplayName("Should update guest profile successfully")
    void testUpdateGuestProfile() {
        // Arrange
        Guest existingGuest = Guest.builder()
            .id(1L)
            .firstName("John")
            .lastName("Doe")
            .email("john@example.com")
            .password("password123")
            .phone("1234567890")
            .age(30)
            .address("Old Address")
            .status(GuestStatus.ACTIVE)
            .build();

        Guest updateGuest = Guest.builder()
            .id(1L)
            .phone("9876543210")
            .address("New Address")
            .city("New City")
            .age(31)
            .build();

        when(guestRepository.findById(1L)).thenReturn(Optional.of(existingGuest));
        when(guestRepository.save(any(Guest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Guest result = guestService.updateGuest(updateGuest);

        // Assert
        assertThat(result.getPhone()).isEqualTo("9876543210");
        assertThat(result.getAddress()).isEqualTo("New Address");
        assertThat(result.getCity()).isEqualTo("New City");
        assertThat(result.getAge()).isEqualTo(31);
    }

    @Test
    @DisplayName("Should reject update with invalid age")
    void testUpdateGuestInvalidAge() {
        // Arrange
        Guest existingGuest = Guest.builder()
            .id(1L)
            .firstName("John")
            .lastName("Doe")
            .email("john@example.com")
            .password("password123")
            .phone("1234567890")
            .age(30)
            .status(GuestStatus.ACTIVE)
            .build();

        Guest updateGuest = Guest.builder()
            .id(1L)
            .age(150)
            .build();

        when(guestRepository.findById(1L)).thenReturn(Optional.of(existingGuest));

        // Act & Assert
        assertThatThrownBy(() -> guestService.updateGuest(updateGuest))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid age");
    }

    @Test
    @DisplayName("Should suspend active guest account")
    void testSuspendActiveGuest() {
        // Arrange
        Guest guest = Guest.builder()
            .id(1L)
            .firstName("John")
            .lastName("Doe")
            .email("john@example.com")
            .password("password123")
            .phone("1234567890")
            .age(30)
            .status(GuestStatus.ACTIVE)
            .build();

        when(guestRepository.findById(1L)).thenReturn(Optional.of(guest));
        when(guestRepository.save(any(Guest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Guest result = guestService.suspendGuest(1L);

        // Assert
        assertThat(result.getStatus()).isEqualTo(GuestStatus.SUSPENDED);
        verify(guestRepository, times(1)).save(any(Guest.class));
    }

    @Test
    @DisplayName("Should reactivate suspended guest account")
    void testReactivateSuspendedGuest() {
        // Arrange
        Guest guest = Guest.builder()
            .id(1L)
            .firstName("John")
            .lastName("Doe")
            .email("john@example.com")
            .password("password123")
            .phone("1234567890")
            .age(30)
            .status(GuestStatus.SUSPENDED)
            .build();

        when(guestRepository.findById(1L)).thenReturn(Optional.of(guest));
        when(guestRepository.save(any(Guest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Guest result = guestService.reactivateGuest(1L);

        // Assert
        assertThat(result.getStatus()).isEqualTo(GuestStatus.ACTIVE);
    }

    // ==========================================
    // Additional Profile, Password & Query Tests
    // ==========================================

    @Test
    @DisplayName("Should successfully change password when current password matches")
    void testChangePasswordSuccess() {
        Guest guest = Guest.builder()
            .id(1L)
            .password("oldPassword123")
            .build();

        when(guestRepository.findById(1L)).thenReturn(Optional.of(guest));
        when(guestRepository.save(any(Guest.class))).thenAnswer(i -> i.getArgument(0));

        Guest updated = guestService.changePassword(1L, "oldPassword123", "newPassword456");
        assertThat(updated.getPassword()).isEqualTo("newPassword456");
    }

    @Test
    @DisplayName("Should reject change password when current password does not match")
    void testChangePasswordMismatch() {
        Guest guest = Guest.builder()
            .id(1L)
            .password("oldPassword123")
            .build();

        when(guestRepository.findById(1L)).thenReturn(Optional.of(guest));

        assertThatThrownBy(() -> guestService.changePassword(1L, "wrongOld", "newPassword456"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Current password is incorrect");
    }

    @Test
    @DisplayName("Should reject new password shorter than 6 characters")
    void testChangePasswordTooShort() {
        assertThatThrownBy(() -> guestService.changePassword(1L, "oldPassword123", "123"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("New password must be at least 6 characters");
    }

    @Test
    @DisplayName("Should update all guest profile fields successfully")
    void testUpdateGuestProfileFields() {
        Guest existing = Guest.builder()
            .id(1L)
            .firstName("Old")
            .lastName("Name")
            .phone("111")
            .age(25)
            .address("Old St")
            .city("Old City")
            .country("Old Country")
            .build();

        Guest update = Guest.builder()
            .id(1L)
            .firstName("New")
            .lastName("User")
            .phone("222")
            .age(35)
            .address("New St")
            .city("New City")
            .country("New Country")
            .build();

        when(guestRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(guestRepository.save(any(Guest.class))).thenAnswer(i -> i.getArgument(0));

        Guest saved = guestService.updateGuest(update);
        assertThat(saved.getFirstName()).isEqualTo("New");
        assertThat(saved.getLastName()).isEqualTo("User");
        assertThat(saved.getCity()).isEqualTo("New City");
    }

    @Test
    @DisplayName("Should retrieve guest by ID and by email")
    void testGetGuestByIdAndEmail() {
        Guest guest = Guest.builder().id(2L).email("user@test.com").build();
        when(guestRepository.findById(2L)).thenReturn(Optional.of(guest));
        when(guestRepository.findByEmail("user@test.com")).thenReturn(Optional.of(guest));

        assertThat(guestService.getGuest(2L)).isPresent();
        assertThat(guestService.getGuestByEmail("user@test.com")).isPresent();
    }

    @Test
    @DisplayName("Should delete guest by ID")
    void testDeleteGuest() {
        Guest guest = Guest.builder().id(3L).build();
        when(guestRepository.findById(3L)).thenReturn(Optional.of(guest));

        guestService.deleteGuest(3L);
        verify(guestRepository).delete(guest);
    }

    @Test
    @DisplayName("Should return regular guests excluding superadmin")
    void testGetAllGuests() {
        Guest regular = Guest.builder().email("regular@example.com").status(GuestStatus.ACTIVE).build();
        Guest admin = Guest.builder().email("12yemom@gmail.com").status(GuestStatus.ACTIVE).build();

        when(guestRepository.findAll()).thenReturn(List.of(regular, admin));
        when(guestRepository.findByStatus(GuestStatus.ACTIVE)).thenReturn(List.of(regular, admin));

        List<Guest> regularGuests = guestService.getAllGuests();
        List<Guest> activeRegular = guestService.getAllActiveGuests();

        assertThat(regularGuests).containsExactly(regular);
        assertThat(activeRegular).containsExactly(regular);
    }

    @Test
    @DisplayName("Should reject authentication with null credentials")
    void testAuthenticateNullCredentials() {
        assertThatThrownBy(() -> guestService.authenticate(null, "pwd"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> guestService.authenticate("test@test.com", null))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Should reject authentication when guest not found")
    void testAuthenticateNotFound() {
        when(guestRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());
        when(guestRepository.findAll()).thenReturn(List.of());

        assertThatThrownBy(() -> guestService.authenticate("unknown@test.com", "pwd"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Guest not found");
    }

    @Test
    @DisplayName("Should reject authentication when account is not active")
    void testAuthenticateInactiveAccount() {
        Guest suspended = Guest.builder()
            .email("suspended@test.com")
            .password("password123")
            .status(GuestStatus.SUSPENDED)
            .build();

        when(guestRepository.findByEmail("suspended@test.com")).thenReturn(Optional.of(suspended));

        assertThatThrownBy(() -> guestService.authenticate("suspended@test.com", "password123"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Account is not active");
    }

    @Test
    @DisplayName("Should reject updateGuest when ID is null or not found")
    void testUpdateGuestErrors() {
        Guest nullId = Guest.builder().id(null).build();
        assertThatThrownBy(() -> guestService.updateGuest(nullId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Guest ID is required");

        Guest missing = Guest.builder().id(999L).build();
        when(guestRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> guestService.updateGuest(missing))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Guest not found");
    }

    @Test
    @DisplayName("Should throw exception on suspend/reactivate/delete when guest not found")
    void testGuestNotFoundOperations() {
        when(guestRepository.findById(888L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> guestService.suspendGuest(888L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Guest not found");

        assertThatThrownBy(() -> guestService.reactivateGuest(888L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Guest not found");

        assertThatThrownBy(() -> guestService.deleteGuest(888L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Guest not found");
    }
}
