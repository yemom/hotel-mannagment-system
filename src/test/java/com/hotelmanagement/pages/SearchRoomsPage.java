package com.hotelmanagement.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import java.util.List;

/**
 * Page Object for Room Search page.
 */
public class SearchRoomsPage extends BasePage {

    // Locators
    private static final By CHECK_IN_INPUT = By.id("checkInDate");
    private static final By CHECK_OUT_INPUT = By.id("checkOutDate");
    private static final By GUESTS_INPUT = By.id("numberOfGuests");
    private static final By SEARCH_BUTTON = By.id("searchBtn");
    private static final By ROOM_CARD = By.className("room-card");
    private static final By ROOM_TYPE = By.className("room-type");
    private static final By ROOM_PRICE = By.className("room-price");
    private static final By BOOK_BUTTON = By.className("bookBtn");
    private static final By NO_RESULTS_MESSAGE = By.className("no-results");

    public SearchRoomsPage(WebDriver driver) {
        super(driver);
    }

    public void navigateToSearch(String baseUrl) {
        if (baseUrl != null && baseUrl.startsWith("data:")) {
            navigateTo(baseUrl);
        } else {
            navigateTo(baseUrl + "/search");
        }
    }

    public void enterCheckInDate(String date) {
        typeText(CHECK_IN_INPUT, date);
    }

    public void enterCheckOutDate(String date) {
        typeText(CHECK_OUT_INPUT, date);
    }

    public void enterNumberOfGuests(String guests) {
        typeText(GUESTS_INPUT, guests);
    }

    public void clickSearchButton() {
        click(SEARCH_BUTTON);
    }

    public void searchRooms(String checkInDate, String checkOutDate, String guests) {
        enterCheckInDate(checkInDate);
        enterCheckOutDate(checkOutDate);
        enterNumberOfGuests(guests);
        clickSearchButton();
    }

    public List<WebElement> getRoomResults() {
        return driver.findElements(ROOM_CARD);
    }

    public int getNumberOfRoomsDisplayed() {
        return getRoomResults().size();
    }

    public boolean areRoomsDisplayed() {
        return getNumberOfRoomsDisplayed() > 0;
    }

    public boolean isNoResultsMessageDisplayed() {
        return isElementVisible(NO_RESULTS_MESSAGE);
    }

    public String getFirstRoomType() {
        List<WebElement> rooms = getRoomResults();
        if (!rooms.isEmpty()) {
            return rooms.get(0).findElement(ROOM_TYPE).getText();
        }
        return "";
    }

    public String getFirstRoomPrice() {
        List<WebElement> rooms = getRoomResults();
        if (!rooms.isEmpty()) {
            return rooms.get(0).findElement(ROOM_PRICE).getText();
        }
        return "";
    }

    public void clickBookButtonForFirstRoom() {
        List<WebElement> rooms = getRoomResults();
        if (!rooms.isEmpty()) {
            rooms.get(0).findElement(BOOK_BUTTON).click();
        }
    }
}
