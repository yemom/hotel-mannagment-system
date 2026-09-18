package com.hotelmanagement.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class RegistrationPage extends BasePage {

    private static final By FULL_NAME = By.id("signup-name");

    private static final By EMAIL = By.id("signup-email");

    private static final By PHONE = By.id("signup-phone");

    private static final By PASSWORD = By.id("signup-password");

    private static final By CONFIRM_PASSWORD = By.id("signup-confirm-password");

    private static final By TERMS = By.id("signup-terms");

    private static final By SUBMIT_BUTTON = By.cssSelector(".auth-form button[type='submit']");

    private static final By ERROR_ALERT = By.cssSelector("[role='alert'].auth-alert-error");

    private static final By AUTH_CARD = By.cssSelector(".auth-card");

    public RegistrationPage(WebDriver driver) {
        super(driver);
    }

    /**
     * Open the real React/Vite registration page.
     */
    public void open(String frontendUrl) {
        navigateTo(frontendUrl + "/signup");
        waitForUrlContains("/signup");
        find(AUTH_CARD);
    }

    /**
     * Kept for compatibility with the old Page Object API.
     */
    public void navigateToRegistration(String url) {
        navigateTo(url);
    }

    /**
     * Verify that the real registration form is visible.
     */
    public boolean isDisplayed() {
        return visible(AUTH_CARD)
                && visible(FULL_NAME)
                && visible(EMAIL)
                && visible(PHONE)
                && visible(PASSWORD)
                && visible(CONFIRM_PASSWORD);
    }

    public boolean isRegistrationFormDisplayed() {
        return isDisplayed();
    }

    /**
     * Register using the real frontend form.
     *
     * The real frontend uses one full-name field rather than
     * separate first-name and last-name fields.
     */
    public void registerGuest(
            String fullName,
            String email,
            String password,
            String phone) {

        type(FULL_NAME, fullName);

        type(EMAIL, email);

        type(PHONE, phone);

        type(PASSWORD, password);

        type(CONFIRM_PASSWORD, password);

        /*
         * Accept the terms checkbox if it is not already selected.
         */
        if (!driver.findElement(TERMS).isSelected()) {
            click(TERMS);
        }

        click(SUBMIT_BUTTON);
    }

    /**
     * Compatibility method for the old test suite.
     *
     * The old fake HTML tests used:
     *
     * firstName, lastName, email, password, phone, age
     *
     * The real React frontend does not have separate first/last
     * name or age fields, so we combine the names.
     */
    public void registerGuest(
            String firstName,
            String lastName,
            String email,
            String password,
            String phone,
            String age) {

        registerGuest(
                firstName + " " + lastName,
                email,
                password,
                phone);
    }

    /**
     * Real React login/signup error.
     */
    public boolean isErrorMessageDisplayed() {
        return visible(ERROR_ALERT);
    }

    public String getErrorMessage() {
        return text(ERROR_ALERT);
    }

    /**
     * Navigate from signup to login.
     */
    public void clickLoginLink() {

        By loginLink = By.cssSelector(
                "a.auth-action-link[href='/login']");

        click(loginLink);

        waitForUrlContains("/login");
    }

    /**
     * The real frontend automatically sends a successfully
     * registered user to /client.
     */
    public void waitForClientDashboard() {
        waitForUrlContains("/client");
    }
}