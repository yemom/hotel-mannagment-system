package com.hotelmanagement.system;

import io.github.bonigarcia.wdm.WebDriverManager;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestInstance;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.io.File;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;

import org.junit.jupiter.api.Assumptions;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class BaseSystemTest {

        protected WebDriver driver;

        protected static final String FRONTEND_URL = System.getProperty(
                        "frontend.url",
                        "http://localhost:5173");

        /**
         * REST base of the running Spring Boot backend.
         * The application is deployed with {@code server.servlet.context-path=/api}
         * and every controller is mapped under {@code /api/**}, so the full
         * effective URL prefix for REST calls is {@code /api/api} (context + mapping).
         */
        protected static final String BACKEND_URL = System.getProperty(
                        "backend.url",
                        "http://localhost:8085/api/api");

        /**
         * Skip the entire test class if the frontend is not reachable.
         * This prevents Selenium system tests from failing in unit-only CI
         * runs where no browser stack has been started.
         */
        @BeforeAll
        void requireFrontend() {
                boolean reachable = false;
                try {
                        HttpURLConnection conn = (HttpURLConnection)
                                new URL(FRONTEND_URL).openConnection();
                        conn.setConnectTimeout(3000);
                        conn.setReadTimeout(3000);
                        conn.connect();
                        reachable = (conn.getResponseCode() > 0);
                        conn.disconnect();
                } catch (Exception ignored) { /* server not running */ }
                Assumptions.assumeTrue(reachable,
                        "Skipping Selenium system tests: frontend not reachable at " + FRONTEND_URL);
        }

        private final long visualPauseMs = Long.parseLong(
                        System.getProperty(
                                        "visual.pause.ms",
                                        "700"));

        @BeforeEach
        void setUp() {

                WebDriverManager.chromedriver()
                                .setup();

                ChromeOptions options = new ChromeOptions();

                options.addArguments(
                                "--start-maximized");

                options.addArguments(
                                "--disable-notifications");

                options.addArguments(
                                "--disable-popup-blocking");

                options.addArguments(
                                "--remote-allow-origins=*");

                /*
                 * Stability flags.
                 *
                 * These address renderer-communication hangs
                 * ("Timed out receiving message from renderer")
                 * seen with recent Chrome builds on Windows.
                 */

                options.addArguments(
                                "--disable-gpu");

                options.addArguments(
                                "--no-sandbox");

                options.addArguments(
                                "--disable-dev-shm-usage");

                options.addArguments(
                                "--disable-extensions");

                options.addArguments(
                                "--disable-background-timer-throttling");

                options.addArguments(
                                "--disable-renderer-backgrounding");

                options.addArguments(
                                "--disable-backgrounding-occluded-windows");

                if (Boolean.getBoolean("chrome.headless")
                                || "true".equalsIgnoreCase(System.getenv("HEADLESS"))
                                || System.getenv("CI") != null) {
                        options.addArguments("--headless=new");
                        options.addArguments("--window-size=1920,1080");
                }

                driver = new ChromeDriver(options);

                driver.manage()
                                .timeouts()
                                .implicitlyWait(
                                                Duration.ZERO);

                driver.manage()
                                .timeouts()
                                .pageLoadTimeout(
                                                Duration.ofSeconds(30));

                driver.manage()
                                .timeouts()
                                .scriptTimeout(
                                                Duration.ofSeconds(30));

                driver.manage()
                                .window()
                                .maximize();
        }

        /**
         * Releases a room for the requested stay window so an end-to-end run stays
         * repeatable.
         *
         * <p>
         * The backend intentionally refuses overlapping stays for the same room
         * (a real double-booking guard), therefore reservation rows left behind by
         * an earlier (possibly failed) run would otherwise block the next one.
         * Every overlapping, still-active reservation for that room is cancelled
         * through the public REST API before the browser starts booking.
         * </p>
         *
         * @param roomNumber room to release, e.g. {@code 301}
         * @param checkIn    ISO check-in date of the stay about to be booked
         * @param checkOut   ISO check-out date of the stay about to be booked
         */
        protected void releaseRoomForStay(
                        String roomNumber,
                        String checkIn,
                        String checkOut) {

                try {

                        java.net.http.HttpClient client = java.net.http.HttpClient
                                        .newHttpClient();

                        java.net.http.HttpRequest listRequest = java.net.http.HttpRequest
                                        .newBuilder(
                                                        java.net.URI.create(
                                                                        BACKEND_URL + "/reservations"))
                                        .GET()
                                        .build();

                        java.net.http.HttpResponse<String> listResponse = client.send(
                                        listRequest,
                                        java.net.http.HttpResponse.BodyHandlers.ofString());

                        if (listResponse.statusCode() != 200) {

                                System.err.println(
                                                "Room release skipped: backend returned "
                                                                + listResponse.statusCode());

                                return;
                        }

                        com.fasterxml.jackson.databind.JsonNode rows = new com.fasterxml.jackson.databind.ObjectMapper()
                                        .readTree(
                                                        listResponse.body());

                        java.time.LocalDate wantedIn = java.time.LocalDate.parse(
                                        checkIn);

                        java.time.LocalDate wantedOut = java.time.LocalDate.parse(
                                        checkOut);


                        for (com.fasterxml.jackson.databind.JsonNode row : rows) {

                                if (!roomNumber.equals(
                                                row.path("room")
                                                                .path("roomNumber")
                                                                .asText(""))) {

                                        continue;
                                }

                                String status = row.path("status")
                                                .asText("");

                                if ("CANCELLED".equals(status)
                                                || "COMPLETED".equals(status)
                                                || "CHECKED_OUT".equals(status)) {

                                        continue;
                                }

                                java.time.LocalDate rowIn = java.time.LocalDate.parse(
                                                row.path("checkInDate")
                                                                .asText());

                                java.time.LocalDate rowOut = java.time.LocalDate.parse(
                                                row.path("checkOutDate")
                                                                .asText());

                                boolean overlaps = rowIn.isBefore(wantedOut)
                                                && rowOut.isAfter(wantedIn);

                                if (!overlaps) {

                                        continue;
                                }

                                long reservationId = row.path("id")
                                                .asLong();

                                java.net.http.HttpRequest cancelRequest = java.net.http.HttpRequest
                                                .newBuilder(
                                                                java.net.URI.create(
                                                                                BACKEND_URL
                                                                                                + "/reservations/"
                                                                                                + reservationId
                                                                                                + "/cancel"))
                                                .POST(
                                                                java.net.http.HttpRequest.BodyPublishers
                                                                                .noBody())
                                                .build();

                                client.send(
                                                cancelRequest,
                                                java.net.http.HttpResponse.BodyHandlers
                                                                .ofString());

                                System.out.println(
                                                "Released Room " + roomNumber
                                                                + " by cancelling overlapping reservation #"
                                                                + reservationId);
                        }

                } catch (Exception e) {

                        System.err.println(
                                        "Could not release Room "
                                                        + roomNumber
                                                        + ": "
                                                        + e.getMessage());
                }
        }


        protected void pauseForVisual() {

                if (visualPauseMs <= 0) {
                        return;
                }

                try {

                        Thread.sleep(
                                        visualPauseMs);

                } catch (InterruptedException e) {

                        Thread.currentThread()
                                        .interrupt();
                }
        }

        protected void screenshot(
                        String name) {

                try {

                        Path directory = Path.of(
                                        "target",
                                        "selenium-screenshots");

                        Files.createDirectories(
                                        directory);

                        File source = ((TakesScreenshot) driver)
                                        .getScreenshotAs(
                                                        OutputType.FILE);

                        Files.copy(
                                        source.toPath(),
                                        directory.resolve(
                                                        name + ".png"),
                                        StandardCopyOption.REPLACE_EXISTING);

                } catch (Exception e) {

                        System.err.println(
                                        "Screenshot failed: "
                                                        + e.getMessage());
                }
        }

        @AfterEach
        void tearDown() {

                if (driver != null) {

                        driver.quit();

                        driver = null;
                }
        }
}