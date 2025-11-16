import { type Page, expect } from "@playwright/test";

/**
 * Page Object Model for Chat/Conversation page
 * Provides methods to interact with chat elements
 */
export class ChatPage {
  constructor(private readonly page: Page) {}

  /**
   * Navigate to the new conversation page
   */
  async gotoNewConversation() {
    await this.page.goto("/app/conversations/new");
  }

  /**
   * Get the model selector
   */
  getModelSelector() {
    return this.page.getByTestId("model-selector");
  }

  /**
   * Verify that the model selector is visible and enabled
   */
  async verifyModelSelectorEnabled() {
    const selector = this.getModelSelector();
    await expect(selector).toBeVisible();
    await expect(selector).toBeEnabled();
  }

  /**
   * Verify that the model selector shows models are available
   * (not showing "No models available" or "Loading models...")
   */
  async verifyModelsLoaded() {
    const selector = this.getModelSelector();
    await expect(selector).toBeVisible();
    await expect(selector).not.toContainText("No models available");
    await expect(selector).not.toContainText("Loading models...");
  }
}
