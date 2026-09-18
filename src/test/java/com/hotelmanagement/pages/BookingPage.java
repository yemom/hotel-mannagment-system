package com.hotelmanagement.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

public class BookingPage extends BasePage {

    private static final By MODAL = By.cssSelector(
            ".booking-summary-modal");

    private static final By CHECK_IN = By.id("modal-checkin");

    private static final By CHECK_OUT = By.id("modal-checkout");

    private static final By GUESTS = By.id("modal-guests");

    private static final By SPECIAL_REQUESTS = By.cssSelector(
            ".booking-summary-modal textarea.textarea");

    private static final By CONFIRM_BUTTON = By.cssSelector(
            ".booking-summary-modal "
                    + "button.confirm-booking-btn");

    private static final By TOTAL = By.cssSelector(
            ".grand-total-amount");

    private static final By SUCCESS_TOAST = By.cssSelector(
            ".client-toast.client-toast-success");

    public BookingPage(WebDriver driver) {
        super(driver);
    }

    public boolean isBookingSummaryDisplayed() {

        return visible(MODAL);
    }

    public String getCheckInDate() {

        return find(CHECK_IN)
                .getAttribute("value");
    }

    public String getCheckOutDate() {

        return find(CHECK_OUT)
                .getAttribute("value");
    }

    public String getNumberOfGuests() {

        return new Select(
                find(GUESTS))
                .getFirstSelectedOption()
                .getAttribute("value");
    }

    public String getBasePrice() {
        return text(TOTAL);
    }

    public String getDiscount() {
        return "0";
    }

    public String getTotalPrice() {
        return text(TOTAL);
    }

    public void setCheckInDate(String date) {
        setDate(CHECK_IN, date);
    }

    public void setCheckOutDate(String date) {
        setDate(CHECK_OUT, date);
    }

    public void setGuests(String guests) {

        new Select(
                find(GUESTS)).selectByValue(guests);
    }

    public void enterSpecialRequest(
            String request) {

        type(
                SPECIAL_REQUESTS,
                request);
    }

    public void confirmBooking(
            String specialRequest) {

        if (specialRequest != null
                && !specialRequest.isBlank()) {

            enterSpecialRequest(
                    specialRequest);
        }

        click(CONFIRM_BUTTON);

        /*
         * The real frontend closes the modal after the
         * reservation is successfully created.
         */
        wait.until(
                ExpectedConditions.invisibilityOfElementLocated(
                        MODAL));

        /*
         * Then it displays the success toast.
         */
        wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        SUCCESS_TOAST));
    }

    public boolean isSuccessMessageDisplayed() {

        return visible(
                SUCCESS_TOAST);
    }

    public String getSuccessMessage() {

        return text(
                SUCCESS_TOAST);
    }
}