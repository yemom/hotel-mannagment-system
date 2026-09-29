package com.hotelmanagement.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import java.util.List;

public class SpaPageObject extends BasePage {

    private static final By SPA_BANNER = By.cssSelector(".spa-header-banner");
    private static final By CATEGORY_PILLS = By.cssSelector(".spa-category-pill");
    private static final By TREATMENT_CARDS = By.cssSelector(".spa-treatment-card");
    private static final By BOOK_BUTTONS = By.xpath("//button[contains(.,'Book This Ritual') or contains(.,'Book Appointment')]");
    private static final By MODAL_HEADER = By.xpath("//h2[contains(.,'Reserve Spa Ritual')]");
    private static final By CONFIRM_BTN = By.xpath("//button[@type='submit' and contains(.,'Confirm Spa Appointment')]");
    private static final By CONFIRMATION_BANNER = By.cssSelector(".booking-confirmation-banner");

    public SpaPageObject(WebDriver driver) {
        super(driver);
    }

    public void open(String frontendUrl) {
        navigateTo(frontendUrl + "/spa");
        waitForPageReady();
        waitForUrlContains("/spa");
        find(SPA_BANNER);
    }

    public boolean isDisplayed() {
        return visible(SPA_BANNER) && visible(CATEGORY_PILLS);
    }

    public int getTreatmentCardsCount() {
        List<WebElement> cards = driver.findElements(TREATMENT_CARDS);
        return cards.size();
    }

    public void clickFirstBookRitual() {
        click(BOOK_BUTTONS);
    }

    public boolean isModalOpen() {
        return visible(MODAL_HEADER);
    }

    public void confirmModalAppointment() {
        click(CONFIRM_BTN);
    }

    public boolean isConfirmationDisplayed() {
        return visible(CONFIRMATION_BANNER);
    }
}
