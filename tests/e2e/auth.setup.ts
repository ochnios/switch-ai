import { expect, test as setup } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import { mkdir } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Resolve path relative to project root (go up from tests/e2e to project root)
const authFile = path.resolve(__dirname, "../../playwright/.auth/user.json");

const E2E_USERNAME = process.env.E2E_USERNAME;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

if (!E2E_USERNAME || !E2E_PASSWORD) {
  throw new Error("E2E_USERNAME and E2E_PASSWORD must be set");
}

setup("authenticate", async ({ page, baseURL }) => {
  if (!baseURL) {
    throw new Error("baseURL is required for authentication setup");
  }

  const loginUrl = `${baseURL}/auth/login`;
  const expectedRedirectUrl = `${baseURL}/app/conversations/new`;

  // Navigate to login page and wait for it to be fully loaded
  await page.goto(loginUrl, { waitUntil: "networkidle" });

  // Wait for login form to be visible and interactive
  const loginForm = page.getByTestId("login-form");
  await expect(loginForm).toBeVisible({ timeout: 10000 });

  // Wait for email input to be visible and fill it
  const emailInput = page.getByTestId("login-email-input");
  await expect(emailInput).toBeVisible({ timeout: 5000 });
  await emailInput.fill(E2E_USERNAME);

  // Wait for password input to be visible and fill it
  const passwordInput = page.getByTestId("login-password-input");
  await expect(passwordInput).toBeVisible({ timeout: 5000 });
  await passwordInput.fill(E2E_PASSWORD);

  // Verify no validation errors are shown before submission
  const emailError = page.getByTestId("login-email-error");
  const passwordError = page.getByTestId("login-password-error");
  await expect(emailError).not.toBeVisible();
  await expect(passwordError).not.toBeVisible();

  // Set up response listener before clicking submit
  const loginResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/auth/login") && response.request().method() === "POST",
    { timeout: 10000 }
  );

  // Click submit button
  const submitButton = page.getByTestId("login-submit-button");
  await expect(submitButton).toBeVisible({ timeout: 5000 });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  // Wait for the API response and verify it was successful
  const loginResponse = await loginResponsePromise;
  if (loginResponse.status() !== 200) {
    const errorData = await loginResponse.json().catch(() => ({}));
    throw new Error(`Login API returned ${loginResponse.status()}: ${errorData.message || JSON.stringify(errorData)}`);
  }

  // Wait a bit for the error message to potentially appear (if login failed)
  // This helps catch cases where the API returns 200 but there's still an error
  await page.waitForTimeout(500);

  // Check for error messages before waiting for navigation
  const generalError = page.getByTestId("login-general-error");
  const errorVisible = await generalError.isVisible().catch(() => false);
  if (errorVisible) {
    const errorText = await generalError.textContent();
    throw new Error(`Login failed with error message: ${errorText}`);
  }

  // Wait for navigation to complete
  // The login form uses window.location.href which causes a full page reload
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL(expectedRedirectUrl, { timeout: 15000 });

  // Verify we're on the correct page by checking for Settings button
  const settingsButton = page.getByTestId("header-settings-button");
  await expect(settingsButton).toBeVisible({ timeout: 10000 });

  // Ensure the directory exists before saving
  const authDir = path.dirname(authFile);
  await mkdir(authDir, { recursive: true });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
