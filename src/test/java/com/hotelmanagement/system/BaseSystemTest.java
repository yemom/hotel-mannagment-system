package com.hotelmanagement.system;

import io.github.bonigarcia.wdm.WebDriverManager;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;

public abstract class BaseSystemTest {

        protected WebDriver driver;

        protected static final String FRONTEND_URL = System.getProperty(
                        "frontend.url",
                        "http://localhost:5173");

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