package com.hotelmanagement.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.NoAlertPresentException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class LoginPage extends BasePage {

    private static final By LOGIN_CARD = By.cssSelector(".auth-card");

    private static final By EMAIL = By.id("login-email");

    private static final By PASSWORD = By.id("login-password");

    private static final By LOGIN_BUTTON = By.cssSelector(
            ".auth-form button[type='submit']");

    private static final By SIGN_UP_LINK = By.cssSelector(
            "a.auth-action-link[href='/signup']");

    /*
     * The React Login component (Login.jsx) renders its error banner as:
     * <div className="auth-alert auth-alert-error" role="alert">
     */
    private static final By ERROR_ALERT = By.cssSelector(
            ".auth-alert.auth-alert-error");

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    public void open(String frontendUrl) {

        navigateTo(
                frontendUrl + "/login");

        waitForPageReady();

        waitForUrlContains("/login");

        find(LOGIN_CARD);
        find(EMAIL);
        find(PASSWORD);
    }

    public void navigateToLogin(String url) {
        navigateTo(url);
    }

    public boolean isDisplayed() {

        return visible(LOGIN_CARD)
                && visible(EMAIL)
                && visible(PASSWORD);
    }

    public boolean isLoginFormDisplayed() {
        return isDisplayed();
    }

    public void login(
            String email,
            String password) {

        type(EMAIL, email);
        type(PASSWORD, password);

        click(LOGIN_BUTTON);

        dismissAnyNativeDialog();
    }

    private void dismissAnyNativeDialog() {

        try {

            wait.until(
                    ExpectedConditions.alertIsPresent());

            driver.switchTo()
                    .alert()
                    .dismiss();

        } catch (NoAlertPresentException
                | org.openqa.selenium.TimeoutException ignored) {
            // No native dialog - normal case.
        }
    }

    public void clickSignUp() {

        click(SIGN_UP_LINK);

        waitForUrlContains("/signup");
    }

    public void clickRegisterLink() {
        clickSignUp();
    }

    public boolean isErrorMessageDisplayed() {
        try {
            return wait.until(
                    ExpectedConditions.visibilityOfElementLocated(
                            ERROR_ALERT))
                    .isDisplayed();
        } catch (org.openqa.selenium.TimeoutException e) {
            try {
                String html = (String) ((org.openqa.selenium.JavascriptExecutor) driver)
                        .executeScript("return document.body.innerHTML;");
                System.err.println("===== LOGIN ERROR LOCATOR TIMED OUT =====");
                System.err.println(html);
                System.err.println("===== END DIAGNOSTIC =====");
            } catch (Exception ex) {
                System.err.println("Could not extract document.body.innerHTML: " + ex.getMessage());
            }
            throw e;
        }
    }

    public String getErrorMessage() {
        return text(ERROR_ALERT);
    }
}