import { test, expect } from "@playwright/test";
import { SettingsPage } from "../page-objects/SettingsPage";
import { HeaderPage } from "../page-objects/HeaderPage";
import { ChatPage } from "../page-objects/ChatPage";

/**
 * Mock models list response
 */
const mockModelsResponse = {
  data: [
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku" },
    { id: "google/gemini-pro", name: "Gemini Pro" },
  ],
};

/**
 * E2E-APIKEY-01: API Key Onboarding Flow
 *
 * Tests the complete flow of a new user setting up their API key for the first time.
 * This test verifies:
 * - Initial state (no API key)
 * - Navigation to settings
 * - Form validation
 * - Successful API key save
 * - Status badge updates
 * - Persistence across page refresh
 * - Models list loading after API key is saved
 */
test.describe("E2E-APIKEY-01: API Key Onboarding Flow", () => {
  let settingsPage: SettingsPage;
  let headerPage: HeaderPage;
  let chatPage: ChatPage;
  const validApiKey = process.env.OPENROUTER_API_KEY || "sk-or-v1-test-key-1234567890";

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
    headerPage = new HeaderPage(page);
    chatPage = new ChatPage(page);

    // Mock the models API endpoint to return deterministic results
    // This ensures the test doesn't depend on external OpenRouter API
    await page.route("**/api/models", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockModelsResponse),
      });
    });
  });

  test("should complete API key onboarding flow", async ({ page, request }) => {
    // Ensure test starts with clean state - delete API key if it exists
    // This ensures the test user doesn't have an API key at the start
    try {
      await request.delete("/api/api-key");
    } catch {
      // API key might not exist, which is fine
    }

    // Step 1.1: New user without API key sees "No API Key" status badge in header
    await page.goto("/app/conversations/new");
    await headerPage.verifyNoApiKeyStatus();

    // Step 1.2: User navigates to /app/settings and sees API key form
    await settingsPage.goto();
    await expect(page).toHaveURL("/app/settings");
    await settingsPage.verifyApiKeyFormVisible();

    // Step 1.3: User sees instruction text explaining API key requirement
    await settingsPage.verifyInstructionText();

    // Step 1.4: User enters invalid API key (not starting with "sk-or-") and sees validation error
    await settingsPage.fillApiKey("invalid-key");
    await settingsPage.clickSave();
    await settingsPage.verifyValidationError("must start with 'sk-or-'");

    // Step 1.5: User enters valid API key (starting with "sk-or-")
    await settingsPage.fillApiKey(validApiKey);

    // Step 1.6: User clicks "Save" button
    // Step 1.7: API key is successfully saved and encrypted
    // Step 1.8: Status badge changes to "API Key Saved"
    await settingsPage.clickSave();
    await settingsPage.waitForSaveToComplete();
    await settingsPage.verifyApiKeySavedStatus();

    // Verify status badge in header also updates
    await headerPage.verifyApiKeyStatus();

    // Step 1.10: User refreshes page and API key status remains "API Key Saved"
    await page.reload();
    await settingsPage.verifyApiKeySavedStatus();
    await headerPage.verifyApiKeyStatus();

    // Step 1.11: Models list is automatically fetched and displayed after saving API key
    // Navigate to chat page to verify models are loaded
    await chatPage.gotoNewConversation();
    await chatPage.verifyModelsLoaded();
  });
});
