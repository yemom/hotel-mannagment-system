package com.hotelmanagement.system;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.htmlunit.HtmlUnitDriver;

/**
 * Base class for all Selenium system tests.
 * Handles WebDriver setup and teardown.
 */
public class BaseSystemTest {

    protected WebDriver driver;
    protected static final String BASE_URL = "http://localhost:8080";

    @BeforeEach
    public void setUp() {
        driver = new HtmlUnitDriver(true);
    }

    @AfterEach
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}
