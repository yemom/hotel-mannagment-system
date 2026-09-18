package com.hotelmanagement.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;

public abstract class BasePage {

    protected final WebDriver driver;
    protected final WebDriverWait wait;

    protected BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(
                driver,
                Duration.ofSeconds(25));
    }

    protected void navigateTo(String url) {
        driver.navigate().to(url);
    }

    protected WebElement find(By locator) {
        try {
            return wait.until(
                    ExpectedConditions.visibilityOfElementLocated(locator));
        } catch (TimeoutException e) {
            dumpFailureState(locator, "find");
            throw e;
        }
    }

    protected WebElement clickable(By locator) {
        try {
            return wait.until(
                    ExpectedConditions.elementToBeClickable(locator));
        } catch (TimeoutException e) {
            dumpFailureState(locator, "clickable");
            throw e;
        }
    }

    protected void click(By locator) {
        clickable(locator).click();
    }

    protected void javascriptClick(By locator) {
        WebElement element = find(locator);

        ((JavascriptExecutor) driver)
                .executeScript(
                        "arguments[0].scrollIntoView({block:'center'});",
                        element);

        ((JavascriptExecutor) driver)
                .executeScript(
                        "arguments[0].click();",
                        element);
    }

    protected void type(By locator, String value) {
        WebElement element = find(locator);

        element.click();
        element.clear();
        element.sendKeys(value);
    }

    protected void setDate(By locator, String value) {

        WebElement element = find(locator);

        ((JavascriptExecutor) driver).executeScript(
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
                            new Event('input', { bubbles: true })
                        );

                        element.dispatchEvent(
                            new Event('change', { bubbles: true })
                        );
                        """,
                element,
                value);
    }

    protected boolean visible(By locator) {
        try {
            return !driver.findElements(locator).isEmpty()
                    && driver.findElements(locator)
                            .get(0)
                            .isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    protected String text(By locator) {
        return find(locator)
                .getText()
                .trim();
    }

    protected void waitForUrlContains(String value) {
        wait.until(
                ExpectedConditions.urlContains(value));
    }

    protected void waitForPageReady() {
        wait.until(driver -> ((JavascriptExecutor) driver)
                .executeScript("return document.readyState")
                .equals("complete"));
    }

    private void dumpFailureState(By locator, String context) {

        try {

            Path directory = Path.of(
                    "target",
                    "selenium-failures");

            Files.createDirectories(directory);

            String safeName = (context
                    + "-"
                    + locator.toString())
                    .replaceAll("[^a-zA-Z0-9._-]", "_");

            if (safeName.length() > 100) {
                safeName = safeName.substring(0, 100);
            }

            String html = (String) ((JavascriptExecutor) driver)
                    .executeScript(
                            "return document.documentElement.outerHTML;");

            Files.writeString(
                    directory.resolve(safeName + ".html"),
                    html);

            File source = ((TakesScreenshot) driver)
                    .getScreenshotAs(OutputType.FILE);

            Files.copy(
                    source.toPath(),
                    directory.resolve(safeName + ".png"),
                    StandardCopyOption.REPLACE_EXISTING);

            System.err.println(
                    "Saved failure dump: target/selenium-failures/"
                            + safeName + ".html/.png");

        } catch (IOException e) {
            System.err.println(
                    "Could not save failure dump: " + e.getMessage());
        }
    }
}