import { type Page, expect } from "@playwright/test";

/**
 * Page Object Model for Settings page
 * Provides methods to interact with the settings page elements
 */
export class SettingsPage {
  constructor(private readonly page: Page) {}

  /**
   * Navigate to the settings page
   */
  async goto() {
    await this.page.goto("/app/settings");
  }

  /**
   * Get the API key section element
   */
  getApiKeySection() {
    return this.page.getByTestId("api-key-section");
  }

  /**
   * Get the API key instruction text
   */
  getInstructionText() {
    return this.page.getByTestId("api-key-instruction-text");
  }

  /**
   * Get the API key input field
   */
  getApiKeyInput() {
    return this.page.getByTestId("api-key-input");
  }

  /**
   * Get the API key save button
   */
  getSaveButton() {
    return this.page.getByTestId("api-key-save-button");
  }

  /**
   * Get the API key status badge
   */
  getStatusBadge() {
    return this.page.getByTestId("api-key-status-badge");
  }

  /**
   * Get the validation error message
   */
  getValidationError() {
    return this.page.getByTestId("api-key-validation-error");
  }

  /**
   * Fill in the API key input field
   */
  async fillApiKey(apiKey: string) {
    await this.getApiKeyInput().fill(apiKey);
  }

  /**
   * Click the save button
   */
  async clickSave() {
    await this.getSaveButton().click();
  }

  /**
   * Save API key with the provided value
   */
  async saveApiKey(apiKey: string) {
    await this.fillApiKey(apiKey);
    await this.clickSave();
  }

  /**
   * Verify that the instruction text is visible and contains expected content
   */
  async verifyInstructionText() {
    const instructionText = this.getInstructionText();
    await expect(instructionText).toBeVisible();
    await expect(instructionText).toContainText("Enter your OpenRouter API key");
  }

  /**
   * Verify that the API key form is visible
   */
  async verifyApiKeyFormVisible() {
    await expect(this.getApiKeySection()).toBeVisible();
    await expect(this.getApiKeyInput()).toBeVisible();
    await expect(this.getSaveButton()).toBeVisible();
  }

  /**
   * Verify that the status badge shows "No API Key"
   */
  async verifyNoApiKeyStatus() {
    const badge = this.getStatusBadge();
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("No API Key");
  }

  /**
   * Verify that the status badge shows "API Key Saved"
   */
  async verifyApiKeySavedStatus() {
    const badge = this.getStatusBadge();
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("API Key Saved");
  }

  /**
   * Verify that validation error is shown
   */
  async verifyValidationError(expectedMessage?: string) {
    const error = this.getValidationError();
    await expect(error).toBeVisible();
    if (expectedMessage) {
      await expect(error).toContainText(expectedMessage);
    }
  }

  /**
   * Verify that no validation error is shown
   */
  async verifyNoValidationError() {
    const error = this.getValidationError();
    await expect(error).not.toBeVisible();
  }

  /**
   * Wait for the save operation to complete
   */
  async waitForSaveToComplete() {
    // Wait for the save button to not be in "Saving..." state
    await expect(this.getSaveButton()).not.toContainText("Saving...");
  }
}
