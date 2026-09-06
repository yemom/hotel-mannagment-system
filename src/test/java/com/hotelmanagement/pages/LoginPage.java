package com.hotelmanagement.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object for Guest Login page.
 */
public class LoginPage extends BasePage {

    // Locators
    private static final By EMAIL_INPUT = By.id("email");
    private static final By PASSWORD_INPUT = By.id("password");
    private static final By LOGIN_BUTTON = By.id("loginBtn");
    private static final By ERROR_MESSAGE = By.className("error-message");
    private static final By REGISTER_LINK = By.id("registerLink");

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    public void navigateToLogin(String baseUrl) {
        if (baseUrl != null && baseUrl.startsWith("data:")) {
            navigateTo(baseUrl);
        } else {
            navigateTo(baseUrl + "/login");
        }
    }

    public void enterEmail(String email) {
        typeText(EMAIL_INPUT, email);
    }

    public void enterPassword(String password) {
        typeText(PASSWORD_INPUT, password);
    }

    public void clickLoginButton() {
        click(LOGIN_BUTTON);
    }

    public void login(String email, String password) {
        enterEmail(email);
        enterPassword(password);
        clickLoginButton();
    }

    public String getErrorMessage() {
        if (isElementPresent(ERROR_MESSAGE)) {
            return getText(ERROR_MESSAGE);
        }
        return "";
    }

    public boolean isErrorMessageDisplayed() {
        return isElementVisible(ERROR_MESSAGE);
    }

    public void clickRegisterLink() {
        click(REGISTER_LINK);
    }

    public boolean isLoginFormDisplayed() {
        return isElementPresent(EMAIL_INPUT) && isElementPresent(PASSWORD_INPUT);
    }
}
