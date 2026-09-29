package com.hotelmanagement.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;

import java.util.List;

public class PublicRoomsPageObject extends BasePage {

    private static final By HEADER_BANNER = By.cssSelector(".rooms-header-banner");
    private static final By TYPE_SELECT = By.id("filter-type");
    private static final By ROOM_CARDS = By.cssSelector(".catalog-room-card");
    private static final By BOOK_NOW_BUTTONS = By.xpath("//button[contains(@class,'public-cta-btn') and contains(.,'Book Now')]");

    public PublicRoomsPageObject(WebDriver driver) {
        super(driver);
    }

    public void open(String frontendUrl) {
        navigateTo(frontendUrl + "/rooms");
        waitForPageReady();
        waitForUrlContains("/rooms");
        find(HEADER_BANNER);
    }

    public boolean isDisplayed() {
        return visible(HEADER_BANNER) && visible(TYPE_SELECT);
    }

    public void selectRoomType(String type) {
        WebElement selectElement = find(TYPE_SELECT);
        Select select = new Select(selectElement);
        select.selectByValue(type);
    }

    public int getRoomCardsCount() {
        List<WebElement> cards = driver.findElements(ROOM_CARDS);
        return cards.size();
    }

    public void clickFirstBookNow() {
        click(BOOK_NOW_BUTTONS);
    }
}
