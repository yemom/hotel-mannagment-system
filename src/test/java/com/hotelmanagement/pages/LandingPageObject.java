package com.hotelmanagement.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class LandingPageObject extends BasePage {

    private static final By NAVBAR = By.cssSelector(".public-navbar");
    private static final By HERO = By.cssSelector(".landing-hero");
    private static final By HEADLINE = By.cssSelector(".hero-headline");
    private static final By EXPLORE_ROOMS_BTN = By.xpath("//a[contains(@class,'public-cta-btn') and contains(.,'Explore Rooms')]");
    private static final By DISCOVER_SPA_BTN = By.xpath("//a[contains(@class,'public-outline-btn') and contains(.,'Discover Spa')]");
    private static final By SEARCH_FORM = By.cssSelector(".hero-search-bar");
    private static final By SEARCH_SUBMIT = By.cssSelector(".hero-search-submit");
    private static final By FOOTER = By.cssSelector(".public-footer");

    public LandingPageObject(WebDriver driver) {
        super(driver);
    }

    public void open(String frontendUrl) {
        navigateTo(frontendUrl + "/");
        waitForPageReady();
        find(NAVBAR);
        find(HERO);
    }

    public boolean isDisplayed() {
        return visible(NAVBAR) && visible(HERO) && visible(HEADLINE) && visible(FOOTER);
    }

    public String getHeadlineText() {
        return find(HEADLINE).getText();
    }

    public void clickExploreRooms() {
        click(EXPLORE_ROOMS_BTN);
        waitForUrlContains("/rooms");
    }

    public void clickDiscoverSpa() {
        click(DISCOVER_SPA_BTN);
        waitForUrlContains("/spa");
    }

    public void submitSearch() {
        click(SEARCH_SUBMIT);
        waitForUrlContains("/rooms");
    }
}
