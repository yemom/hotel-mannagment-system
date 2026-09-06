package com.hotelmanagement.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object for Room Booking page.
 */
public class BookingPage extends BasePage {

    // Locators
    private static final By ROOM_DETAILS = By.id("roomDetails");
    private static final By CHECK_IN_DISPLAY = By.id("checkInDisplay");
    private static final By CHECK_OUT_DISPLAY = By.id("checkOutDisplay");
    private static final By GUESTS_DISPLAY = By.id("guestsDisplay");
    private static final By PRICE_DISPLAY = By.id("priceDisplay");
    private static final By DISCOUNT_DISPLAY = By.id("discountDisplay");
    private static final By TOTAL_PRICE_DISPLAY = By.id("totalPriceDisplay");
    private static final By SPECIAL_REQUESTS = By.id("specialRequests");
    private static final By CONFIRM_BOOKING_BUTTON = By.id("confirmBookingBtn");
    private static final By CANCEL_BUTTON = By.id("cancelBtn");
    private static final By SUCCESS_MESSAGE = By.className("booking-success");
    private static final By ERROR_MESSAGE = By.className("booking-error");

    public BookingPage(WebDriver driver) {
        super(driver);
    }

    public void navigateToBooking(String baseUrl, String roomId) {
        if (baseUrl != null && baseUrl.startsWith("data:")) {
            navigateTo(baseUrl);
        } else {
            navigateTo(baseUrl + "/booking/" + roomId);
        }
    }

    public String getCheckInDate() {
        return getText(CHECK_IN_DISPLAY);
    }

    public String getCheckOutDate() {
        return getText(CHECK_OUT_DISPLAY);
    }

    public String getNumberOfGuests() {
        return getText(GUESTS_DISPLAY);
    }

    public String getBasePrice() {
        return getText(PRICE_DISPLAY);
    }

    public String getDiscount() {
        if (isElementPresent(DISCOUNT_DISPLAY)) {
            return getText(DISCOUNT_DISPLAY);
        }
        return "0";
    }

    public String getTotalPrice() {
        return getText(TOTAL_PRICE_DISPLAY);
    }

    public void enterSpecialRequests(String requests) {
        typeText(SPECIAL_REQUESTS, requests);
    }

    public void clickConfirmBookingButton() {
        click(CONFIRM_BOOKING_BUTTON);
    }

    public void clickCancelButton() {
        click(CANCEL_BUTTON);
    }

    public void confirmBooking(String specialRequests) {
        if (!specialRequests.isEmpty()) {
            enterSpecialRequests(specialRequests);
        }
        clickConfirmBookingButton();
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

    public boolean isBookingSummaryDisplayed() {
        return isElementPresent(ROOM_DETAILS) && isElementPresent(TOTAL_PRICE_DISPLAY);
    }

    public boolean isSuccessMessageDisplayed() {
        return isElementPresent(SUCCESS_MESSAGE);
    }
}
