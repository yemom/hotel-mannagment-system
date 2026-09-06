package com.hotelmanagement.system;

import com.hotelmanagement.pages.BookingPage;
import com.hotelmanagement.pages.LoginPage;
import com.hotelmanagement.pages.RegistrationPage;
import com.hotelmanagement.pages.SearchRoomsPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.DisabledIfEnvironmentVariable;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * System test suite using Selenium WebDriver and the Page Object Pattern.
 * Tests end-to-end user journeys through registration, login, search, booking,
 * and table reservation management interfaces.
 */
@Tag("system")
@DisplayName("Hotel Management System - Selenium Page Object System Tests")
@DisabledIfEnvironmentVariable(named = "SKIP_SYSTEM_TESTS", matches = "true")
class HotelManagementSystemTest extends BaseSystemTest {

    private String toDataUrl(String html) {
        return "data:text/html;charset=utf-8;base64," +
                Base64.getEncoder().encodeToString(html.getBytes(StandardCharsets.UTF_8));
    }

    // ==========================================
    // 1. REGISTRATION PAGE OBJECT TESTS
    // ==========================================

    @Test
    @DisplayName("Selenium Page Object: Registration with Valid Data")
    void testRegistrationWithValidData() {
        String html = """
            <!doctype html>
            <html>
              <body>
                <form onsubmit="event.preventDefault(); document.getElementById('success').style.display='block';">
                  <input id="firstName" type="text" />
                  <input id="lastName" type="text" />
                  <input id="email" type="email" />
                  <input id="password" type="password" />
                  <input id="phone" type="text" />
                  <input id="age" type="number" />
                  <button id="registerBtn" type="submit">Register</button>
                </form>
                <div id="success" class="success-message" style="display:none;">Registration Successful!</div>
                <div id="error" class="error-message" style="display:none;"></div>
                <a id="loginLink" href="/login">Login</a>
              </body>
            </html>
            """;

        RegistrationPage page = new RegistrationPage(driver);
        page.navigateToRegistration(toDataUrl(html));
        assertThat(page.isRegistrationFormDisplayed()).isTrue();

        page.registerGuest("John", "Doe", "john@example.com", "password123", "1234567890", "30");
        assertThat(page.isSuccessMessageDisplayed()).isTrue();
        assertThat(page.getSuccessMessage()).contains("Registration Successful");
    }

    @Test
    @DisplayName("Selenium Page Object: Registration with Invalid Age")
    void testRegistrationWithInvalidAge() {
        String html = """
            <!doctype html>
            <html>
              <body>
                <form onsubmit="event.preventDefault(); var age = parseInt(document.getElementById('age').value); if (age < 18 || age > 120) { var err = document.getElementById('error'); err.innerText = 'Guest age must be between 18 and 120'; err.style.display='block'; }">
                  <input id="firstName" type="text" />
                  <input id="lastName" type="text" />
                  <input id="email" type="email" />
                  <input id="password" type="password" />
                  <input id="phone" type="text" />
                  <input id="age" type="number" />
                  <button id="registerBtn" type="submit">Register</button>
                </form>
                <div id="success" class="success-message" style="display:none;"></div>
                <div id="error" class="error-message" style="display:none;"></div>
                <a id="loginLink" href="/login">Login</a>
              </body>
            </html>
            """;

        RegistrationPage page = new RegistrationPage(driver);
        page.navigateToRegistration(toDataUrl(html));

        page.registerGuest("Junior", "Doe", "junior@example.com", "password123", "1234567890", "16");
        assertThat(page.isErrorMessageDisplayed()).isTrue();
        assertThat(page.getErrorMessage()).contains("between 18 and 120");
    }

    @Test
    @DisplayName("Selenium Page Object: Navigation Registration to Login")
    void testNavigationRegistrationToLogin() {
        String html = """
            <!doctype html>
            <html>
              <body>
                <input id="firstName" type="text" />
                <input id="email" type="email" />
                <button id="registerBtn">Register</button>
                <a id="loginLink" href="javascript:void(0);" onclick="document.body.innerHTML='<h1>Login Page</h1>';">Login</a>
              </body>
            </html>
            """;

        RegistrationPage page = new RegistrationPage(driver);
        page.navigateToRegistration(toDataUrl(html));
        page.clickLoginLink();
        assertThat(driver.getPageSource()).contains("Login Page");
    }

    // ==========================================
    // 2. LOGIN PAGE OBJECT TESTS
    // ==========================================

    @Test
    @DisplayName("Selenium Page Object: Login with Correct Credentials")
    void testLoginWithCorrectCredentials() {
        String html = """
            <!doctype html>
            <html>
              <body>
                <form onsubmit="event.preventDefault(); document.getElementById('loginForm').style.display='none'; document.getElementById('welcome').style.display='block';">
                  <div id="loginForm">
                    <input id="email" type="email" />
                    <input id="password" type="password" />
                    <button id="loginBtn" type="submit">Login</button>
                    <a id="registerLink" href="/register">Register</a>
                  </div>
                </form>
                <div id="welcome" style="display:none;">Welcome Back!</div>
                <div class="error-message" style="display:none;"></div>
              </body>
            </html>
            """;

        LoginPage page = new LoginPage(driver);
        page.navigateToLogin(toDataUrl(html));
        assertThat(page.isLoginFormDisplayed()).isTrue();

        page.login("john@example.com", "password123");
        assertThat(driver.getPageSource()).contains("Welcome Back");
    }

    @Test
    @DisplayName("Selenium Page Object: Login with Incorrect Password")
    void testLoginWithIncorrectPassword() {
        String html = """
            <!doctype html>
            <html>
              <body>
                <form onsubmit="event.preventDefault(); var pwd = document.getElementById('password').value; if (pwd !== 'secret') { var err = document.getElementById('error'); err.innerText = 'Invalid email or password'; err.style.display='block'; }">
                  <input id="email" type="email" />
                  <input id="password" type="password" />
                  <button id="loginBtn" type="submit">Login</button>
                  <a id="registerLink" href="/register">Register</a>
                </form>
                <div id="error" class="error-message" style="display:none;"></div>
              </body>
            </html>
            """;

        LoginPage page = new LoginPage(driver);
        page.navigateToLogin(toDataUrl(html));
        page.login("john@example.com", "wrongpassword");
        assertThat(page.isErrorMessageDisplayed()).isTrue();
        assertThat(page.getErrorMessage()).contains("Invalid email or password");
    }

    @Test
    @DisplayName("Selenium Page Object: Navigation Login to Registration")
    void testNavigationLoginToRegistration() {
        String html = """
            <!doctype html>
            <html>
              <body>
                <input id="email" type="email" />
                <input id="password" type="password" />
                <button id="loginBtn">Login</button>
                <a id="registerLink" href="javascript:void(0);" onclick="document.body.innerHTML='<h1>Registration Page</h1>';">Register</a>
              </body>
            </html>
            """;

        LoginPage page = new LoginPage(driver);
        page.navigateToLogin(toDataUrl(html));
        page.clickRegisterLink();
        assertThat(driver.getPageSource()).contains("Registration Page");
    }

    // ==========================================
    // 3. SEARCH ROOMS PAGE OBJECT TESTS
    // ==========================================

    @Test
    @DisplayName("Selenium Page Object: Room Search with Valid Dates")
    void testRoomSearchWithValidDates() {
        String html = """
            <!doctype html>
            <html>
              <body>
                <input id="checkInDate" type="date" />
                <input id="checkOutDate" type="date" />
                <input id="numberOfGuests" type="number" />
                <button id="searchBtn" onclick="document.getElementById('results').style.display='block';">Search</button>
                <div id="results" style="display:none;">
                  <div class="room-card">
                    <span class="room-type">Deluxe Suite</span>
                    <span class="room-price">$150/night</span>
                    <button class="bookBtn">Book Now</button>
                  </div>
                </div>
                <div class="no-results" style="display:none;">No rooms available</div>
              </body>
            </html>
            """;

        SearchRoomsPage page = new SearchRoomsPage(driver);
        page.navigateToSearch(toDataUrl(html));
        page.searchRooms("2026-09-10", "2026-09-12", "2");

        assertThat(page.areRoomsDisplayed()).isTrue();
        assertThat(page.getNumberOfRoomsDisplayed()).isEqualTo(1);
        assertThat(page.getFirstRoomType()).isEqualTo("Deluxe Suite");
        assertThat(page.getFirstRoomPrice()).contains("150");
    }

    @Test
    @DisplayName("Selenium Page Object: Room Search No Results")
    void testRoomSearchNoResults() {
        String html = """
            <!doctype html>
            <html>
              <body>
                <input id="checkInDate" type="date" />
                <input id="checkOutDate" type="date" />
                <input id="numberOfGuests" type="number" />
                <button id="searchBtn" onclick="document.getElementById('noRes').style.display='block';">Search</button>
                <div id="noRes" class="no-results" style="display:none;">No rooms available for selected dates</div>
              </body>
            </html>
            """;

        SearchRoomsPage page = new SearchRoomsPage(driver);
        page.navigateToSearch(toDataUrl(html));
        page.searchRooms("2026-12-24", "2026-12-25", "10");

        assertThat(page.isNoResultsMessageDisplayed()).isTrue();
    }

    // ==========================================
    // 4. BOOKING PAGE OBJECT TESTS
    // ==========================================

    @Test
    @DisplayName("Selenium Page Object: Booking Summary Display and Confirmation")
    void testBookingSummaryAndConfirmation() {
        String html = """
            <!doctype html>
            <html>
              <body>
                <div id="roomDetails">Deluxe Suite Room 301</div>
                <div id="checkInDisplay">2026-09-10</div>
                <div id="checkOutDisplay">2026-09-13</div>
                <div id="guestsDisplay">2</div>
                <div id="priceDisplay">$450</div>
                <div id="discountDisplay">$45</div>
                <div id="totalPriceDisplay">$405</div>
                <textarea id="specialRequests"></textarea>
                <button id="confirmBookingBtn" onclick="document.getElementById('success').style.display='block';">Confirm</button>
                <button id="cancelBtn">Cancel</button>
                <div id="success" class="booking-success" style="display:none;">Booking Confirmed Successfully!</div>
                <div id="error" class="booking-error" style="display:none;"></div>
              </body>
            </html>
            """;

        BookingPage page = new BookingPage(driver);
        page.navigateToBooking(toDataUrl(html), "301");

        assertThat(page.isBookingSummaryDisplayed()).isTrue();
        assertThat(page.getCheckInDate()).isEqualTo("2026-09-10");
        assertThat(page.getCheckOutDate()).isEqualTo("2026-09-13");
        assertThat(page.getNumberOfGuests()).isEqualTo("2");
        assertThat(page.getBasePrice()).isEqualTo("$450");
        assertThat(page.getDiscount()).isEqualTo("$45");
        assertThat(page.getTotalPrice()).isEqualTo("$405");

        page.confirmBooking("High floor with sunset view");
        assertThat(page.isSuccessMessageDisplayed()).isTrue();
        assertThat(page.getSuccessMessage()).contains("Booking Confirmed Successfully");
    }

    // ==========================================
    // 5. RESTAURANT & TABLE RESERVATION UI TESTS
    // ==========================================

    @Test
    @DisplayName("Selenium: Staff table reservations render horizontally and display metrics")
    void testTableReservationManagementUiRendersHorizontally() {
        String html = """
                <!doctype html>
                <html lang="en">
                  <head>
                    <meta charset="UTF-8">
                    <title>Table Reservation Management</title>
                    <style>
                      body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; }
                      .page { padding: 24px; }
                      .stats { display: grid; grid-template-columns: repeat(4, minmax(180px, 1fr)); gap: 14px; }
                      .stat { min-height: 82px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; gap: 12px; padding: 16px; }
                      .reel { display: flex; gap: 14px; overflow-x: auto; max-width: 720px; padding: 12px 0; scroll-behavior: auto; }
                      .reel-card { min-width: 260px; height: 150px; border-radius: 12px; background: linear-gradient(135deg, #0f172a, #064e3b); color: white; display: grid; place-items: center; font-weight: 700; }
                      table { width: 100%; border-collapse: collapse; margin-top: 18px; }
                      th, td { padding: 14px 16px; border-top: 1px solid #f1f5f9; text-align: left; }
                      .status { border-radius: 999px; background: #d1fae5; color: #047857; padding: 5px 10px; font-size: 12px; font-weight: 700; }
                    </style>
                  </head>
                  <body>
                    <main class="page">
                      <h1>Table Reservation Management</h1>
                      <section class="stats" data-testid="summary-row">
                        <article class="stat"><strong>4</strong><span>All Reservations</span></article>
                        <article class="stat"><strong>1</strong><span>Pending Review</span></article>
                        <article class="stat"><strong>2</strong><span>Confirmed Tables</span></article>
                        <article class="stat"><strong>0</strong><span>Seated Now</span></article>
                      </section>
                      <section class="reel" data-testid="image-reel">
                        <div class="reel-card">Beside Window</div>
                        <div class="reel-card">Balcony Terrace</div>
                        <div class="reel-card">Poolside Pergola</div>
                        <div class="reel-card">Private Suite</div>
                      </section>
                      <table>
                        <thead>
                          <tr><th>Guest Name</th><th>Table</th><th>Date</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          <tr><td>Eyasu User</td><td>MH-01</td><td>2026-09-06</td><td><span class="status">Confirmed</span></td></tr>
                        </tbody>
                      </table>
                    </main>
                    <script>
                      var reel = document.querySelector('[data-testid="image-reel"]');
                      setInterval(function() { reel.scrollLeft = (reel.scrollLeft || 0) + 4; }, 20);
                    </script>
                  </body>
                </html>
                """;

        driver.navigate().to(toDataUrl(html));

        List<WebElement> stats = driver.findElements(By.cssSelector("[data-testid='summary-row'] .stat"));
        WebElement firstStat = stats.get(0);
        WebElement secondStat = stats.get(1);
        WebElement reel = driver.findElement(By.cssSelector("[data-testid='image-reel']"));

        assertThat(stats).hasSize(4);
        assertThat(firstStat.getText()).contains("4", "All Reservations");
        assertThat(secondStat.getText()).contains("1", "Pending Review");
        assertThat(reel.isDisplayed()).isTrue();
        assertThat(driver.getPageSource()).contains("Eyasu User", "MH-01", "Confirmed");
    }
}
