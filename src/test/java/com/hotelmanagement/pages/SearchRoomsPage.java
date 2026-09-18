package com.hotelmanagement.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

import java.util.List;

public class SearchRoomsPage extends BasePage {

    private static final By CLIENT_NAVBAR = By.cssSelector(".client-navbar");

    private static final By BOOK_ROOM_NAV = By.xpath(
            "//nav[contains(@class,'client-nav-links')]"
                    + "//button[.//span[normalize-space()='Book a Room']]");

    private static final By DATE_INPUTS = By.cssSelector(
            ".client-portal-shell input[type='date']");

    private static final By GUEST_SELECT = By.xpath(
            "//label[contains(normalize-space(.),'GUESTS & ROOM')]"
                    + "/following-sibling::select");

    private static final By SEARCH_BUTTON = By.xpath(
            "//button[@type='submit']"
                    + "[.//span[normalize-space()='Check & Search']]");

    private static final By ROOM_ARTICLES = By.cssSelector(
            ".client-portal-shell article");

    private static final By BOOKING_FORM = By.xpath(
            "//form[.//span[normalize-space()='Check & Search']]");

    public SearchRoomsPage(WebDriver driver) {
        super(driver);
    }

    public void open(String frontendUrl) {

        navigateTo(
                frontendUrl + "/client");

        waitForPageReady();

        waitForUrlContains("/client");

        find(CLIENT_NAVBAR);
    }

    public void navigateToSearch(String url) {
        navigateTo(url);
    }

    public void waitForClientDashboard() {

        wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        CLIENT_NAVBAR));
    }

    public void openBookingTab() {

        waitForClientDashboard();

        WebElement button = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        BOOK_ROOM_NAV));

        /*
         * Scroll to the actual navigation button.
         */
        ((JavascriptExecutor) driver)
                .executeScript(
                        "arguments[0].scrollIntoView({block:'center'});",
                        button);

        /*
         * Normal click first.
         */
        try {

            wait.until(
                    ExpectedConditions.elementToBeClickable(
                            BOOK_ROOM_NAV))
                    .click();

        } catch (Exception e) {

            /*
             * React navbar can occasionally be covered while
             * the dashboard is still rendering.
             */
            ((JavascriptExecutor) driver)
                    .executeScript(
                            "arguments[0].click();",
                            button);
        }

        /*
         * The booking tab must render the search form.
         */
        wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        BOOKING_FORM));

        wait.until(
                ExpectedConditions.numberOfElementsToBeMoreThan(
                        DATE_INPUTS,
                        1));
    }

    public void enterCheckInDate(String date) {
        setDateByIndex(0, date);
    }

    public void enterCheckOutDate(String date) {
        setDateByIndex(1, date);
    }

    private void setDateByIndex(
            int index,
            String date) {

        List<WebElement> inputs = driver.findElements(DATE_INPUTS);

        if (inputs.size() <= index) {

            throw new NoSuchElementException(
                    "Could not find date input index "
                            + index
                            + ". Found "
                            + inputs.size()
                            + " date inputs.");
        }

        WebElement input = inputs.get(index);

        ((JavascriptExecutor) driver)
                .executeScript(
                        """
                                const element = arguments[0];
                                const value = arguments[1];

                                const setter =
                                  Object.getOwnPropertyDescriptor(
                                    HTMLInputElement.prototype,
                                    'value'
                                  ).set;

                                setter.call(element, value);

                                element.dispatchEvent(
                                  new Event('input', {bubbles:true})
                                );

                                element.dispatchEvent(
                                  new Event('change', {bubbles:true})
                                );
                                """,
                        input,
                        date);
    }

    public void selectGuests(String guests) {

        WebElement selectElement = find(GUEST_SELECT);

        new Select(selectElement)
                .selectByValue(guests);
    }

    public void searchRooms(
            String checkIn,
            String checkOut,
            String guests) {

        enterCheckInDate(checkIn);

        enterCheckOutDate(checkOut);

        selectGuests(guests);

        WebElement search = find(SEARCH_BUTTON);

        ((JavascriptExecutor) driver)
                .executeScript(
                        "arguments[0].scrollIntoView({block:'center'});",
                        search);

        click(SEARCH_BUTTON);

        /*
         * Search updates React state. Give the UI time to
         * finish rendering the room catalog.
         */
        wait.until(driver -> driver.findElements(ROOM_ARTICLES)
                .size() > 0);
    }

    public boolean areRoomsDisplayed() {

        return !driver
                .findElements(ROOM_ARTICLES)
                .isEmpty();
    }

    public int getNumberOfRoomsDisplayed() {

        return driver
                .findElements(ROOM_ARTICLES)
                .size();
    }

    public String getFirstRoomType() {

        List<WebElement> rooms = driver.findElements(ROOM_ARTICLES);

        if (rooms.isEmpty()) {
            throw new NoSuchElementException(
                    "No room cards found.");
        }

        return rooms.get(0)
                .getText()
                .trim();
    }

    public String getFirstRoomPrice() {

        List<WebElement> rooms = driver.findElements(ROOM_ARTICLES);

        if (rooms.isEmpty()) {
            throw new NoSuchElementException(
                    "No room cards found.");
        }

        return rooms.get(0)
                .getText()
                .trim();
    }

    public boolean isNoResultsMessageDisplayed() {

        return visible(
                By.xpath(
                        "//*[contains(normalize-space(.),"
                                + "'No rooms found')]"));
    }

    public void reserveRoom(String roomNumber) {

        By roomCard = By.xpath(
                "//article["
                        + ".//*[contains("
                        + "normalize-space(.),"
                        + "'Room " + roomNumber
                        + "')]"
                        + "]");

        WebElement card = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        roomCard));

        WebElement reserveButton = card.findElement(
                By.xpath(
                        ".//button["
                                + ".//span["
                                + "normalize-space()='Reserve Suite'"
                                + "]"
                                + "]"));

        ((JavascriptExecutor) driver)
                .executeScript(
                        "arguments[0].scrollIntoView({block:'center'});",
                        reserveButton);

        try {

            wait.until(
                    ExpectedConditions.elementToBeClickable(
                            reserveButton))
                    .click();

        } catch (Exception e) {

            ((JavascriptExecutor) driver)
                    .executeScript(
                            "arguments[0].click();",
                            reserveButton);
        }
    }

    public void selectFirstRoom(String roomId) {
        reserveRoom(roomId);
    }
}