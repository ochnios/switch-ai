import { type Page, expect } from "@playwright/test";

/**
 * Page Object Model for Header component
 * Provides methods to interact with header elements
 */
export class HeaderPage {
  constructor(private readonly page: Page) {}

  /**
   * Get the API key status indicator in the header
   */
  getApiKeyStatusIndicator() {
    return this.page.getByTestId("api-key-status-indicator");
  }

  /**
   * Get the Settings button
   */
  getSettingsButton() {
    return this.page.getByRole("button", { name: "Settings" });
  }

  /**
   * Click the Settings button
   */
  async clickSettings() {
    await this.getSettingsButton().click();
  }

  /**
   * Verify that the API key status indicator shows "No API Key"
   */
  async verifyNoApiKeyStatus() {
    const indicator = this.getApiKeyStatusIndicator();
    await expect(indicator).toBeVisible();
    await expect(indicator).toContainText("No API Key");
  }

  /**
   * Verify that the API key status indicator shows "API Key"
   */
  async verifyApiKeyStatus() {
    const indicator = this.getApiKeyStatusIndicator();
    await expect(indicator).toBeVisible();
    await expect(indicator).toContainText("API Key");
  }

  /**
   * Verify that the API key status indicator shows "Checking..."
   */
  async verifyCheckingStatus() {
    const indicator = this.getApiKeyStatusIndicator();
    await expect(indicator).toBeVisible();
    await expect(indicator).toContainText("Checking...");
  }

  /**
   * Wait for the API key status to be checked (not in "Checking..." state)
   */
  async waitForStatusCheck() {
    const indicator = this.getApiKeyStatusIndicator();
    await expect(indicator).not.toContainText("Checking...");
  }
}
