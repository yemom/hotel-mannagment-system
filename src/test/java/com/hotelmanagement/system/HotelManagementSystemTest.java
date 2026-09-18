package com.hotelmanagement.system;

import com.hotelmanagement.pages.BookingPage;
import com.hotelmanagement.pages.LoginPage;
import com.hotelmanagement.pages.RegistrationPage;
import com.hotelmanagement.pages.SearchRoomsPage;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Tag("system")
@DisplayName("Hotel Management System - Visual Selenium E2E")
class HotelManagementSystemTest extends BaseSystemTest {

        private WebDriverWait getWait() {
                return new WebDriverWait(
                                driver,
                                Duration.ofSeconds(20));
        }

        @Test
        @DisplayName("E2E: application opens in the real Chrome browser")
        void testApplicationOpens() {

                LoginPage login = new LoginPage(driver);

                login.open(FRONTEND_URL);

                pauseForVisual();
                screenshot("01-login-page");

                assertThat(driver.getCurrentUrl())
                                .contains("/login");

                assertThat(login.isDisplayed())
                                .isTrue();
        }

        @Test
        @DisplayName("E2E: invalid credentials display a real UI validation error")
        void testInvalidLogin() {

                LoginPage login = new LoginPage(driver);

                login.open(FRONTEND_URL);

                pauseForVisual();

                /*
                 * IMPORTANT:
                 *
                 * 1) A malformed email like "invalid-email" is intercepted by the browser's
                 *    native HTML5 validation before reaching JavaScript.
                 * 2) Any client credentials with password length >= 6 are auto-registered and
                 *    logged in by the frontend AuthContext fallback, redirecting to /client.
                 * 3) To exercise the app's real UI validation error (.auth-alert-error),
                 *    we supply a syntactically valid email with a password under 6 characters (e.g. "12345").
                 *    This passes HTML5 form validation (no minlength on input) but is rejected by
                 *    the React form handler, displaying the real error alert and keeping the user on /login.
                 */

                login.login(
                                "nonexistent.user@example.com",
                                "12345");

                pauseForVisual();
                screenshot("02-invalid-login");

                assertThat(
                                login.isErrorMessageDisplayed()).isTrue();

                assertThat(
                                login.getErrorMessage()).contains("Password must be at least 6 characters");

                assertThat(
                                driver.getCurrentUrl()).contains("/login");
        }

        @Test
        @DisplayName("E2E: complete guest registration and room booking journey")
        void testCompleteGuestBookingJourney() {

                String uniqueEmail = "e2e."
                                + UUID.randomUUID()
                                                .toString()
                                                .substring(0, 8)
                                + "@example.com";

                String password = "Password123!";

                String checkIn = LocalDate.now()
                                .plusDays(2)
                                .toString();

                String checkOut = LocalDate.now()
                                .plusDays(5)
                                .toString();

                LoginPage login = new LoginPage(driver);

                login.open(FRONTEND_URL);

                pauseForVisual();
                screenshot("03-login-page");

                assertThat(
                                login.isDisplayed()).isTrue();

                login.clickSignUp();

                pauseForVisual();
                screenshot("04-signup-page");

                assertThat(
                                driver.getCurrentUrl()).contains("/signup");

                RegistrationPage signup = new RegistrationPage(driver);

                assertThat(
                                signup.isDisplayed()).isTrue();

                signup.registerGuest(
                                "Selenium E2E Guest",
                                uniqueEmail,
                                password,
                                "+251900123456");

                signup.waitForClientDashboard();

                pauseForVisual();
                screenshot("05-client-dashboard-after-signup");

                assertThat(
                                driver.getCurrentUrl()).contains("/client");

                By profileChip = By.cssSelector(
                                "button.client-profile-chip");

                getWait().until(
                                ExpectedConditions.elementToBeClickable(
                                                profileChip))
                                .click();

                pauseForVisual();
                screenshot("06-profile-menu");

                By logoutButton = By.cssSelector(
                                "button.dropdown-item.logout-item");

                getWait().until(
                                ExpectedConditions.elementToBeClickable(
                                                logoutButton))
                                .click();

                getWait().until(
                                ExpectedConditions.urlContains(
                                                "/login"));

                pauseForVisual();
                screenshot("07-after-logout");

                assertThat(
                                driver.getCurrentUrl()).contains("/login");

                login = new LoginPage(driver);

                login.login(
                                uniqueEmail,
                                password);

                getWait().until(
                                ExpectedConditions.urlContains(
                                                "/client"));

                pauseForVisual();
                screenshot("08-logged-in-client");

                assertThat(
                                driver.getCurrentUrl()).contains("/client");

                SearchRoomsPage search = new SearchRoomsPage(driver);

                search.openBookingTab();

                pauseForVisual();
                screenshot("09-book-room-page");

                search.searchRooms(
                                checkIn,
                                checkOut,
                                "2");

                pauseForVisual();
                screenshot("10-room-search-results");

                assertThat(
                                search.areRoomsDisplayed()).isTrue();

                assertThat(
                                search.getNumberOfRoomsDisplayed()).isGreaterThan(0);

                search.reserveRoom("301");

                pauseForVisual();
                screenshot("11-booking-modal");

                BookingPage booking = new BookingPage(driver);

                assertThat(
                                booking.isBookingSummaryDisplayed()).isTrue();

                assertThat(
                                booking.getCheckInDate()).isEqualTo(checkIn);

                assertThat(
                                booking.getCheckOutDate()).isEqualTo(checkOut);

                assertThat(
                                booking.getNumberOfGuests()).isEqualTo("2");

                booking.confirmBooking(
                                "High floor with sunset view");

                pauseForVisual();
                screenshot("12-booking-confirmed");

                assertThat(
                                booking.isSuccessMessageDisplayed()).isTrue();

                assertThat(
                                booking.getSuccessMessage()).contains(
                                                "Reservation confirmed for Room 301");

                By myReservations = By.xpath(
                                "//button[contains(@class,'client-nav-link') and .//span[normalize-space()='My Reservations']]");

                getWait().until(
                                ExpectedConditions.elementToBeClickable(
                                                myReservations))
                                .click();

                pauseForVisual();
                screenshot("13-my-reservations");

                getWait().until(
                                ExpectedConditions.visibilityOfElementLocated(
                                                By.xpath(
                                                                "//h1[normalize-space()='My Reservations']")));

                String pageText = driver.findElement(
                                By.tagName("body")).getText();

                assertThat(pageText)
                                .contains("Room 301");

                assertThat(pageText)
                                .contains(checkIn);

                assertThat(pageText)
                                .contains(checkOut);

                assertThat(pageText)
                                .contains("2 Guests");
        }
}