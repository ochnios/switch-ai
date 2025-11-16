import { test, expect } from "@playwright/test";

/**
 * Example E2E test demonstrating Playwright basics
 *
 * This file serves as a reference for writing E2E tests.
 * Delete or move this file once you have your own tests.
 */

test.describe("Example: Basic E2E Tests", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await expect(page).toHaveTitle(/switch-ai/i);
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Click on login button/link
    await page.getByRole("link", { name: /login/i }).click();

    // Verify navigation
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe("Example: Form Testing", () => {
  test("should fill and submit a form", async ({ page }) => {
    await page.goto("/auth/login");

    // Fill form fields
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");

    // Submit form
    await page.getByRole("button", { name: /login/i }).click();

    // Wait for navigation or response
    // await expect(page).toHaveURL('/app/conversations/new');
  });
});

test.describe("Example: API Mocking", () => {
  test("should mock API response", async ({ page }) => {
    // Mock API route
    await page.route("**/api/conversations", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            { id: "1", title: "Test Conversation 1" },
            { id: "2", title: "Test Conversation 2" },
          ],
        }),
      });
    });

    await page.goto("/app/conversations/new");

    // Verify mocked data is displayed
    // await expect(page.getByText('Test Conversation 1')).toBeVisible();
  });

  test("should handle API errors", async ({ page }) => {
    // Mock API error
    await page.route("**/api/conversations", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Internal Server Error",
        }),
      });
    });

    await page.goto("/app/conversations/new");

    // Verify error message is displayed
    // await expect(page.getByText(/error/i)).toBeVisible();
  });
});

test.describe("Example: User Interactions", () => {
  test("should handle button clicks", async ({ page }) => {
    await page.goto("/");

    // Click a button
    await page.getByRole("button", { name: /get started/i }).click();

    // Verify interaction result
    // await expect(page).toHaveURL('/auth/register');
  });

  test("should handle keyboard shortcuts", async ({ page }) => {
    await page.goto("/app/conversations/new");

    // Use keyboard shortcut
    await page.keyboard.press("Control+Enter");

    // Verify action was triggered
  });
});

test.describe("Example: Visual Testing", () => {
  test("should match screenshot", async ({ page }) => {
    await page.goto("/");

    // Take screenshot and compare
    // await expect(page).toHaveScreenshot('homepage.png');
  });
});

test.describe("Example: Accessibility Testing", () => {
  test("should have no accessibility violations", async ({ page }) => {
    await page.goto("/");

    // You can integrate @axe-core/playwright here
    // const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    // expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe("Example: Authentication Flow", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("complete login flow", async ({ page }) => {
    // Go to login page
    await page.goto("/auth/login");

    // Fill credentials
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");

    // Submit form
    await page.getByRole("button", { name: /login/i }).click();

    // Wait for redirect
    // await expect(page).toHaveURL('/app/conversations/new');

    // Verify user is logged in
    // await expect(page.getByText(/welcome/i)).toBeVisible();
  });
});
