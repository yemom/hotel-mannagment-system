package com.hotelmanagement.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object for Guest Registration page.
 */
public class RegistrationPage extends BasePage {

    // Locators
    private static final By FIRST_NAME_INPUT = By.id("firstName");
    private static final By LAST_NAME_INPUT = By.id("lastName");
    private static final By EMAIL_INPUT = By.id("email");
    private static final By PASSWORD_INPUT = By.id("password");
    private static final By PHONE_INPUT = By.id("phone");
    private static final By AGE_INPUT = By.id("age");
    private static final By REGISTER_BUTTON = By.id("registerBtn");
    private static final By SUCCESS_MESSAGE = By.className("success-message");
    private static final By ERROR_MESSAGE = By.className("error-message");
    private static final By LOGIN_LINK = By.id("loginLink");

    public RegistrationPage(WebDriver driver) {
        super(driver);
    }

    public void navigateToRegistration(String baseUrl) {
        if (baseUrl != null && baseUrl.startsWith("data:")) {
            navigateTo(baseUrl);
        } else {
            navigateTo(baseUrl + "/register");
        }
    }

    public void enterFirstName(String firstName) {
        typeText(FIRST_NAME_INPUT, firstName);
    }

    public void enterLastName(String lastName) {
        typeText(LAST_NAME_INPUT, lastName);
    }

    public void enterEmail(String email) {
        typeText(EMAIL_INPUT, email);
    }

    public void enterPassword(String password) {
        typeText(PASSWORD_INPUT, password);
    }

    public void enterPhone(String phone) {
        typeText(PHONE_INPUT, phone);
    }

    public void enterAge(String age) {
        typeText(AGE_INPUT, age);
    }

    public void clickRegisterButton() {
        click(REGISTER_BUTTON);
    }

    public void registerGuest(String firstName, String lastName, String email, 
                              String password, String phone, String age) {
        enterFirstName(firstName);
        enterLastName(lastName);
        enterEmail(email);
        enterPassword(password);
        enterPhone(phone);
        enterAge(age);
        clickRegisterButton();
    }

    public String getSuccessMessage() {
        if (isElementPresent(SUCCESS_MESSAGE)) {
            return getText(SUCCESS_MESSAGE);
        }
        return "";
    }

    public String getErrorMessage() {
        if (isElementPresent(ERROR_MESSAGE)) {
            return getText(ERROR_MESSAGE);
        }
        return "";
    }

    public boolean isSuccessMessageDisplayed() {
        return isElementVisible(SUCCESS_MESSAGE);
    }

    public boolean isErrorMessageDisplayed() {
        return isElementVisible(ERROR_MESSAGE);
    }

    public void clickLoginLink() {
        click(LOGIN_LINK);
    }

    public boolean isRegistrationFormDisplayed() {
        return isElementPresent(FIRST_NAME_INPUT) && isElementPresent(EMAIL_INPUT);
    }
}
